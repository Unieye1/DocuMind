const GLOBAL_LIMIT = 90;
const INGESTION_LIMIT = 70;
const WINDOW_MS = 60 * 1000;

const questionQueue = [];
const ingestionQueue = [];

const globalRequests = [];
const ingestionRequests = [];

let processing = false;

function cleanOldRequests(requests) {
  const cutoff = Date.now() - WINDOW_MS;

  while (requests.length > 0 && requests[0] <= cutoff) {
    requests.shift();
  }
}

function getWaitTime(requests, limit, cost = 1) {
  cleanOldRequests(requests);

  const excess = requests.length + cost - limit;

  if (excess <= 0) {
    return 0;
  }

  return Math.max(0, requests[excess - 1] + WINDOW_MS - Date.now());
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueueEmbedding(task, priority = "ingestion", cost = 1) {
  if (!Number.isInteger(cost) || cost < 1 || cost > GLOBAL_LIMIT) {
    return Promise.reject(new Error(`Invalid embedding job cost: ${cost}`));
  }

  return new Promise((resolve, reject) => {
    const job = { task, resolve, reject, cost };

    if (priority === "question") {
      questionQueue.push(job);
    } else {
      ingestionQueue.push(job);
    }

    processQueue();
  });
}

async function processQueue() {
  if (processing) return;

  processing = true;

  try {
    while (questionQueue.length > 0 || ingestionQueue.length > 0) {
      cleanOldRequests(globalRequests);
      cleanOldRequests(ingestionRequests);

      const hasQuestions = questionQueue.length > 0;
      const jobQueue = hasQuestions ? questionQueue : ingestionQueue;
      const job = jobQueue[0];

      const globalWait = getWaitTime(globalRequests, GLOBAL_LIMIT, job.cost);

      const ingestionWait = hasQuestions
        ? 0
        : getWaitTime(ingestionRequests, INGESTION_LIMIT, job.cost);

      const waitTime = Math.max(globalWait, ingestionWait);

      if (waitTime > 0) {
        await sleep(waitTime);
        continue;
      }

      jobQueue.shift();

      const now = Date.now();

      for (let i = 0; i < job.cost; i++) {
        globalRequests.push(now);

        if (!hasQuestions) {
          ingestionRequests.push(now);
        }
      }

      try {
        const result = await job.task();
        job.resolve(result);
      } catch (error) {
        job.reject(error);
      }
    }
  } finally {
    processing = false;

    if (questionQueue.length > 0 || ingestionQueue.length > 0) {
      processQueue();
    }
  }
}

module.exports = enqueueEmbedding;
