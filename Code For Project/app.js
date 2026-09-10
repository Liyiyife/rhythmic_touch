const BACKUP_KEY = "rhythmTouchStudyBackupV5";
const SESSION_KEY = "rhythmTouchStudySessionV2";
const PROGRESS_KEY_PREFIX = "rhythmTouchStudyProgressV3:";
const DATA_RESET_MARKER = "rhythmTouchStudyDataReset20260910";
const SUCCESS_THRESHOLD = 80;
const MAX_ATTEMPTS = 3;

if (localStorage.getItem(DATA_RESET_MARKER) !== "done") {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (
      key?.startsWith("rhythmTouchStudyBackup") ||
      key?.startsWith("rhythmTouchStudySession") ||
      key?.startsWith("rhythmTouchStudyProgress")
    ) {
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem(DATA_RESET_MARKER, "done");
}

const emptyBackup = () => ({
  users: [],
  trials: [],
  attempts: [],
  actions: [],
  survey_responses: [],
});

const practiceTasks = [
  {
    patternId: "PRACTICE_TAP",
    name: "Three even taps",
    description: "Tap three times at an even rhythm.",
    complexity: "simple",
    input: "tap-only",
    feedback: "multimodal",
    actions: ["tap", "tap", "tap"],
    intervals: [500, 500],
    repetition: 1,
  },
  {
    patternId: "PRACTICE_MIXED",
    name: "Tap, tap, swipe",
    description: "Tap twice, then swipe right.",
    complexity: "simple",
    input: "tap-and-swipe",
    feedback: "multimodal",
    actions: ["tap", "tap", "right"],
    intervals: [500, 500],
    repetition: 1,
  },
];

const originalBlocks = [
  {
    id: "B1",
    stage: "block-1",
    name: "Rhythmic complexity",
    iv: "rhythmic_complexity",
    description:
      "This block varies the timing structure while keeping the other settings constant.",
    levels: [
      {
        id: "B1_SIMPLE",
        name: "Simple rhythm",
        value: "simple",
        questions: [
          {
            name: "ease",
            text: "How easy was it to reproduce the simple rhythm patterns?",
            left: "Very difficult",
            middle: "Neither difficult nor easy",
            right: "Very easy",
          },
        ],
        tasks: [
          {
            patternId: "S",
            name: "Simple rhythm S",
            description: "Tap four times with three 500 ms intervals.",
            complexity: "simple",
            input: "tap-only",
            feedback: "multimodal",
            actions: ["tap", "tap", "tap", "tap"],
            intervals: [500, 500, 500],
            repetition: 1,
          },
        ],
      },
      {
        id: "B1_COMPLEX",
        name: "Complex rhythm",
        value: "complex",
        questions: [
          {
            name: "ease",
            text: "How easy was it to reproduce the complex rhythm patterns?",
            left: "Very difficult",
            middle: "Neither difficult nor easy",
            right: "Very easy",
          },
        ],
        tasks: [
          {
            patternId: "C1",
            name: "Complex rhythm C1",
            description: "Tap four times with intervals of 350, 500, and 650 ms.",
            complexity: "complex",
            input: "tap-only",
            feedback: "multimodal",
            actions: ["tap", "tap", "tap", "tap"],
            intervals: [350, 500, 650],
            repetition: 1,
          },
          {
            patternId: "C2",
            name: "Complex rhythm C2",
            description: "Tap four times with intervals of 650, 500, and 350 ms.",
            complexity: "complex",
            input: "tap-only",
            feedback: "multimodal",
            actions: ["tap", "tap", "tap", "tap"],
            intervals: [650, 500, 350],
            repetition: 1,
          },
          {
            patternId: "C3",
            name: "Complex rhythm C3",
            description: "Tap four times with intervals of 350, 650, and 500 ms.",
            complexity: "complex",
            input: "tap-only",
            feedback: "multimodal",
            actions: ["tap", "tap", "tap", "tap"],
            intervals: [350, 650, 500],
            repetition: 1,
          },
          {
            patternId: "C4",
            name: "Complex rhythm C4",
            description: "Tap four times with intervals of 650, 350, and 500 ms.",
            complexity: "complex",
            input: "tap-only",
            feedback: "multimodal",
            actions: ["tap", "tap", "tap", "tap"],
            intervals: [650, 350, 500],
            repetition: 1,
          },
        ],
      },
    ],
  },
  {
    id: "B2",
    stage: "block-2",
    name: "Input action type",
    iv: "input_action_type",
    description:
      "This block keeps the rhythm even and varies the actions used for input.",
    levels: [
      {
        id: "B2_TAP_ONLY",
        name: "Tap-only",
        value: "tap-only",
        questions: [
          {
            name: "ease",
            text: "How easy was it to perform the tap-only patterns?",
            left: "Very difficult",
            middle: "Neither difficult nor easy",
            right: "Very easy",
          },
        ],
        tasks: [
          {
            patternId: "T1",
            name: "Tap-only T1",
            description: "Tap four times at an even rhythm.",
            complexity: "simple",
            input: "tap-only",
            feedback: "multimodal",
            actions: ["tap", "tap", "tap", "tap"],
            intervals: [500, 500, 500],
            repetition: 1,
          },
        ],
      },
      {
        id: "B2_TAP_SWIPE",
        name: "Tap-and-swipe",
        value: "tap-and-swipe",
        questions: [
          {
            name: "ease",
            text: "How easy was it to perform the tap-and-swipe patterns?",
            left: "Very difficult",
            middle: "Neither difficult nor easy",
            right: "Very easy",
          },
        ],
        tasks: [
          {
            patternId: "M1",
            name: "Mixed-action M1",
            description: "Tap three times, then swipe right.",
            complexity: "simple",
            input: "tap-and-swipe",
            feedback: "multimodal",
            actions: ["tap", "tap", "tap", "right"],
            intervals: [500, 500, 500],
            repetition: 1,
          },
          {
            patternId: "M2",
            name: "Mixed-action M2",
            description: "Tap twice, swipe right, then tap once.",
            complexity: "simple",
            input: "tap-and-swipe",
            feedback: "multimodal",
            actions: ["tap", "tap", "right", "tap"],
            intervals: [500, 500, 500],
            repetition: 1,
          },
          {
            patternId: "M3",
            name: "Mixed-action M3",
            description: "Tap once, swipe right, then tap twice.",
            complexity: "simple",
            input: "tap-and-swipe",
            feedback: "multimodal",
            actions: ["tap", "right", "tap", "tap"],
            intervals: [500, 500, 500],
            repetition: 1,
          },
          {
            patternId: "M4",
            name: "Mixed-action M4",
            description: "Swipe right, then tap three times.",
            complexity: "simple",
            input: "tap-and-swipe",
            feedback: "multimodal",
            actions: ["right", "tap", "tap", "tap"],
            intervals: [500, 500, 500],
            repetition: 1,
          },
        ],
      },
    ],
  },
  {
    id: "B3",
    stage: "block-3",
    name: "Feedback modality",
    iv: "feedback_modality",
    description:
      "This block keeps the task constant and varies the feedback modality.",
    levels: [
      {
        id: "B3_NONE",
        name: "No feedback",
        value: "none",
        questions: [
          {
            name: "ease",
            text: "How easy was it to follow the rhythm in this condition?",
            left: "Very difficult",
            middle: "Neither difficult nor easy",
            right: "Very easy",
          },
          {
            name: "recognition_confidence",
            text: "How confident were you that the system correctly recognised your input?",
            left: "Not at all confident",
            middle: "Neither confident nor unconfident",
            right: "Very confident",
          },
        ],
      },
      {
        id: "B3_VISUAL",
        name: "Visual feedback",
        value: "visual",
        questions: [
          {
            name: "ease",
            text: "How easy was it to follow the rhythm in this condition?",
            left: "Very difficult",
            middle: "Neither difficult nor easy",
            right: "Very easy",
          },
          {
            name: "feedback_helpfulness",
            text: "How helpful was the visual feedback for following the rhythm?",
            left: "Not at all helpful",
            middle: "Neither helpful nor unhelpful",
            right: "Very helpful",
          },
          {
            name: "recognition_confidence",
            text: "How confident were you that the system correctly recognised your input?",
            left: "Not at all confident",
            middle: "Neither confident nor unconfident",
            right: "Very confident",
          },
        ],
      },
      {
        id: "B3_AUDIO",
        name: "Audio feedback",
        value: "audio",
        questions: [
          {
            name: "ease",
            text: "How easy was it to follow the rhythm in this condition?",
            left: "Very difficult",
            middle: "Neither difficult nor easy",
            right: "Very easy",
          },
          {
            name: "feedback_helpfulness",
            text: "How helpful was the audio feedback for following the rhythm?",
            left: "Not at all helpful",
            middle: "Neither helpful nor unhelpful",
            right: "Very helpful",
          },
          {
            name: "recognition_confidence",
            text: "How confident were you that the system correctly recognised your input?",
            left: "Not at all confident",
            middle: "Neither confident nor unconfident",
            right: "Very confident",
          },
        ],
      },
      {
        id: "B3_HAPTIC",
        name: "Haptic feedback",
        value: "haptic",
        questions: [
          {
            name: "ease",
            text: "How easy was it to follow the rhythm in this condition?",
            left: "Very difficult",
            middle: "Neither difficult nor easy",
            right: "Very easy",
          },
          {
            name: "feedback_helpfulness",
            text: "How helpful was the haptic feedback for following the rhythm?",
            left: "Not at all helpful",
            middle: "Neither helpful nor unhelpful",
            right: "Very helpful",
          },
          {
            name: "recognition_confidence",
            text: "How confident were you that the system correctly recognised your input?",
            left: "Not at all confident",
            middle: "Neither confident nor unconfident",
            right: "Very confident",
          },
        ],
      },
    ].map((level) => ({
      ...level,
      tasks: [
        {
          patternId: `FM_${level.value.toUpperCase()}`,
          name: level.name,
          description: "Tap four times with three 500 ms intervals.",
          complexity: "simple",
          input: "tap-only",
          feedback: level.value,
          actions: ["tap", "tap", "tap", "tap"],
          intervals: [500, 500, 500],
          repetition: 1,
        },
      ],
    })),
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const BLOCK_ORDERS = [
  ["B1", "B2", "B3"],
  ["B1", "B3", "B2"],
  ["B2", "B1", "B3"],
  ["B2", "B3", "B1"],
  ["B3", "B1", "B2"],
  ["B3", "B2", "B1"],
];

function buildExperimentBlocks(participantNumber) {
  const orderIndex = Math.floor((participantNumber - 1) / 2) % BLOCK_ORDERS.length;
  return BLOCK_ORDERS[orderIndex].map((blockId, presentationIndex) => {
    const block = clone(originalBlocks.find((item) => item.id === blockId));
    block.stage = `block-${presentationIndex + 1}`;
    return block;
  });
}

let blocks = [];

const tlxQuestions = [
  {
    name: "mental_demand",
    text: "How mentally demanding was this block?",
    left: "Very low",
    right: "Very high",
  },
  {
    name: "physical_demand",
    text: "How physically demanding was this block?",
    left: "Very low",
    right: "Very high",
  },
  {
    name: "temporal_demand",
    text: "How hurried or rushed did you feel while completing this block?",
    left: "Very low",
    right: "Very high",
  },
  {
    name: "perceived_performance",
    text: "How successful were you in completing this block?",
    left: "Very successful",
    right: "Complete failure",
  },
  {
    name: "effort",
    text: "How hard did you have to work to complete this block?",
    left: "Very low",
    right: "Very high",
  },
  {
    name: "frustration",
    text: "How insecure, discouraged, irritated, stressed, or annoyed did you feel?",
    left: "Very low",
    right: "Very high",
  },
];

const stageOrder = [
  "instructions",
  "practice",
  "block-1",
  "block-2",
  "block-3",
  "complete",
];

const $ = (selector) => document.querySelector(selector);
const touchArea = $("#touchArea");

let backup = loadBackup();
let user = null;
let authToken = null;
let syncQueue = Promise.resolve();
let isPractice = false;
let practiceIndex = 0;
let practiceAttemptNumber = 0;
let blockIndex = 0;
let levelIndex = 0;
let trialIndex = 0;
let currentTrial = null;
let currentAttempt = null;
let events = [];
let previewEndedAt = null;
let endTimer = null;
let tickTimer = null;
let visualFeedbackTimer = null;
let startPoint = null;
let audioContext = null;
let currentPhase = "instructions";
let lastResult = null;
let previewActive = false;

function loadBackup() {
  try {
    return {
      ...emptyBackup(),
      ...JSON.parse(localStorage.getItem(BACKUP_KEY) || "{}"),
    };
  } catch {
    return emptyBackup();
  }
}

function saveBackup() {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
}

function progressKey() {
  return user ? `${PROGRESS_KEY_PREFIX}${user.user_id}` : null;
}

function loadStudyProgress() {
  const key = progressKey();
  if (!key) return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function saveStudyProgress(phase = currentPhase) {
  const key = progressKey();
  if (!key || !blocks.length) return;
  currentPhase = phase;
  localStorage.setItem(
    key,
    JSON.stringify({
      phase,
      blocks,
      isPractice,
      practiceIndex,
      practiceAttemptNumber,
      blockIndex,
      levelIndex,
      trialIndex,
      currentTrialId: currentTrial?.trial_id || null,
      lastResult,
    }),
  );
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return Date.now();
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function show(selector) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.add("hidden");
  });
  $(selector).classList.remove("hidden");
  document.body.classList.toggle("task-active", selector === "#studyView");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateStage(stage) {
  $("#studySteps").classList.remove("hidden");
  const activeIndex = stageOrder.indexOf(stage);
  document.querySelectorAll("#studySteps [data-stage]").forEach((item) => {
    const index = stageOrder.indexOf(item.dataset.stage);
    item.classList.toggle("current", index === activeIndex);
    item.classList.toggle("done", index < activeIndex);
  });
}

async function api(path, body = null, authenticated = false) {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(authenticated && authToken
        ? { Authorization: `Bearer ${authToken}` }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Request failed");
  }
  return result;
}

function syncRecord(table, record) {
  syncQueue = syncQueue
    .then(() => api("/api/sync", { table, record }, true))
    .catch((error) => {
      console.error("SQLite sync failed:", error);
      const detail = $("#resultDetail");
      if (detail) {
        detail.textContent =
          "The data could not be saved. Keep this page open and tell the researcher.";
      }
    });
  return syncQueue;
}

$("#authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#authError").textContent = "";
  try {
    const result = await api("/api/login", {
      username: $("#username").value.trim(),
      password: $("#password").value,
    });
    setSignedInUser(result);
  } catch (error) {
    $("#authError").textContent = error.message;
  }
});

$("#registerBtn").addEventListener("click", async () => {
  const username = $("#username").value.trim();
  const password = $("#password").value;
  if (!username || !password) {
    $("#authError").textContent = "Enter a username and password.";
    return;
  }
  $("#authError").textContent = "";
  try {
    const result = await api("/api/register", { username, password });
    setSignedInUser(result);
  } catch (error) {
    $("#authError").textContent = error.message;
  }
});

function setSignedInUser(result) {
  user = result.user;
  authToken = result.token;
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ user, token: authToken }),
  );
  backup.users = [user];
  saveBackup();
  startStudy(loadStudyProgress());
}

function startStudy(savedProgress = null) {
  blocks =
    Array.isArray(savedProgress?.blocks) && savedProgress.blocks.length === 3
      ? savedProgress.blocks
      : buildExperimentBlocks(Number(user.participant_number) || 1);
  isPractice = false;
  practiceIndex = 0;
  practiceAttemptNumber = 0;
  blockIndex = 0;
  levelIndex = 0;
  trialIndex = 0;
  currentTrial = null;
  lastResult = null;
  currentPhase = "instructions";

  if (savedProgress) {
    isPractice = Boolean(savedProgress.isPractice);
    practiceIndex = Number(savedProgress.practiceIndex) || 0;
    practiceAttemptNumber =
      Number(savedProgress.practiceAttemptNumber) || 0;
    blockIndex = Math.min(
      Math.max(Number(savedProgress.blockIndex) || 0, 0),
      blocks.length - 1,
    );
    levelIndex = Math.min(
      Math.max(Number(savedProgress.levelIndex) || 0, 0),
      blocks[blockIndex].levels.length - 1,
    );
    trialIndex = Math.min(
      Math.max(Number(savedProgress.trialIndex) || 0, 0),
      blocks[blockIndex].levels[levelIndex].tasks.length - 1,
    );
    currentTrial =
      backup.trials.find(
        (trial) => trial.trial_id === savedProgress.currentTrialId,
      ) || null;
    lastResult = savedProgress.lastResult || null;
    currentPhase = savedProgress.phase || "instructions";
  }

  if (currentPhase === "practice-intro") {
    updateStage("practice");
    show("#practiceIntroView");
  } else if (currentPhase === "practice-task") {
    isPractice = true;
    renderTrial({ resume: true });
  } else if (currentPhase === "block-intro") {
    isPractice = false;
    renderBlockIntro();
  } else if (currentPhase === "trial") {
    renderTrial({ resume: true });
  } else if (currentPhase === "sub-block-survey") {
    renderSubBlockSurvey();
  } else if (currentPhase === "block-survey") {
    renderBlockSurvey();
  } else if (currentPhase === "complete") {
    updateStage("complete");
    show("#completeView");
  } else {
    updateStage("instructions");
    show("#instructionsView");
    saveStudyProgress("instructions");
  }
}

$("#continueToPracticeBtn").addEventListener("click", () => {
  updateStage("practice");
  show("#practiceIntroView");
  saveStudyProgress("practice-intro");
});

$("#startPracticeBtn").addEventListener("click", () => {
  isPractice = true;
  practiceIndex = 0;
  renderTrial();
});

function currentBlock() {
  return blocks[blockIndex];
}

function currentLevel() {
  return currentBlock().levels[levelIndex];
}

function currentTask() {
  return isPractice
    ? practiceTasks[practiceIndex]
    : currentLevel().tasks[trialIndex];
}

function totalFormalTasks() {
  return blocks.reduce(
    (blockTotal, block) =>
      blockTotal +
      block.levels.reduce(
        (levelTotal, level) => levelTotal + level.tasks.length,
        0,
      ),
    0,
  );
}

function completedFormalTasks() {
  let completed = 0;
  blocks.forEach((block, currentBlockIndex) => {
    if (currentBlockIndex < blockIndex) {
      completed += block.levels.reduce(
        (total, level) => total + level.tasks.length,
        0,
      );
    }
  });
  currentBlock().levels.forEach((level, currentLevelIndex) => {
    if (currentLevelIndex < levelIndex) completed += level.tasks.length;
  });
  return completed + trialIndex;
}

function renderTaskProgress() {
  let total;
  let current;
  if (isPractice) {
    total = practiceTasks.length;
    current = practiceIndex;
  } else {
    const block = currentBlock();
    total = block.levels.reduce((sum, level) => sum + level.tasks.length, 0);
    current = block.levels
      .slice(0, levelIndex)
      .reduce((sum, level) => sum + level.tasks.length, 0) + trialIndex;
  }
  $("#taskProgress").innerHTML = Array.from(
    { length: total },
    (_, index) =>
      `<span class="task-step${index < current ? " complete" : ""}${index === current ? " current" : ""}" aria-label="Task ${index + 1}${index === current ? ", current" : index < current ? ", complete" : ""}">${index + 1}</span>`,
  ).join("");
}

function renderBlockIntro() {
  const block = currentBlock();
  updateStage(block.stage);
  show("#transitionView");
  currentTrial = null;
  lastResult = null;
  $("#transitionView").innerHTML = `
    <div class="card hero">
      <span class="eyebrow">Block ${blockIndex + 1} of ${blocks.length}</span>
      <h2>${block.name}</h2>
      <p>${block.description}</p>
    </div>
    <div class="card level-summary">
      <span class="eyebrow">${block.levels.length} conditions</span>
      ${block.levels
        .map(
          (level, index) => `
            <div class="level-row">
              <b>${index + 1}</b>
              <span>${level.name}</span>
              <small>${level.tasks.length} ${level.tasks.length === 1 ? "task" : "tasks"}</small>
            </div>`,
        )
        .join("")}
    </div>
    <button id="startBlockBtn" class="primary wide">Start block ${blockIndex + 1}</button>`;
  $("#startBlockBtn").addEventListener("click", () => {
    levelIndex = 0;
    trialIndex = 0;
    renderTrial();
  });
  saveStudyProgress("block-intro");
}

function icon(action) {
  if (action === "tap") return "●";
  if (action === "right") return "→";
  if (action === "left") return "←";
  return "↕";
}

function actionLabel(action) {
  if (action === "tap") return "Tap";
  if (action === "right") return "Swipe right";
  if (action === "left") return "Swipe left";
  return "Vertical swipe";
}

function feedbackDescription(feedback) {
  if (feedback === "none") return "No feedback is provided during input.";
  if (feedback === "visual") return "A visual pulse provides feedback for each input.";
  if (feedback === "audio") return "A sound provides feedback for each input.";
  if (feedback === "haptic") return "A vibration provides feedback for each input.";
  return "Visual, audio, and haptic feedback are enabled.";
}

function hasFeedback(feedback, modality) {
  return feedback === modality || feedback === "multimodal";
}

function renderTrial({ resume = false } = {}) {
  const task = currentTask();
  const resumedResult = resume ? lastResult : null;
  if (!resume) {
    lastResult = null;
    currentTrial = null;
  }
  previewEndedAt = null;
  if (isPractice && !resume) practiceAttemptNumber = 0;
  $("#resultCard").classList.remove("visual-success", "visual-failure");

  if (isPractice) {
    updateStage("practice");
    $("#patternCategory").textContent = "Practice task · Not included in study data";
  } else {
    const block = currentBlock();
    const level = currentLevel();
    updateStage(block.stage);
    $("#patternCategory").textContent =
      `${block.name.toUpperCase()} · ${level.name.toUpperCase()}`;
  }
  renderTaskProgress();

  $("#patternName").textContent = task.name;
  $("#patternDescription").textContent =
    `Preview the pattern, then reproduce it in the area below. ${feedbackDescription(task.feedback)}`;
  $("#previewBtn").textContent = "Preview pattern";
  $("#previewBtn").classList.remove("hidden");
  $("#eventTrail").classList.toggle(
    "hidden",
    !isPractice && !hasFeedback(task.feedback, "visual"),
  );
  touchArea.dataset.feedback = task.feedback;
  touchArea.classList.toggle(
    "has-visual-feedback",
    isPractice || hasFeedback(task.feedback, "visual"),
  );
  $("#nextTrialBtn").classList.add("hidden");
  show("#studyView");
  resetAttempt();
  if (!isPractice && !(resume && currentTrial)) createTrial();
  currentPhase = isPractice ? "practice-task" : "trial";
  lastResult = resumedResult;
  saveStudyProgress(currentPhase);
  if (resumedResult) {
    currentAttempt =
      backup.attempts.find(
        (attempt) => attempt.attempt_id === resumedResult.attemptId,
      ) || {
        attempt_number: resumedResult.attemptNumber,
        attempt_end_time: resumedResult.attemptEndTime || now(),
      };
    displayAttemptResult(resumedResult, false);
  }
}

function createTrial() {
  const block = currentBlock();
  const task = currentTask();
  currentTrial = {
    trial_id: makeId("T"),
    user_id: user.user_id,
    block_id: block.id,
    block_number: blockIndex + 1,
    sub_block_order: levelIndex + 1,
    pattern_order: trialIndex + 1,
    trial_number:
      backup.trials.filter((trial) => trial.user_id === user.user_id).length + 1,
    repetition_number: task.repetition,
    pattern_id: task.patternId,
    rhythmic_complexity: task.complexity,
    input_action_type: task.input,
    feedback_modality: task.feedback,
    target_action_sequence: task.actions,
    target_rhythm_intervals: task.intervals,
    task_success: false,
    trial_start_time: now(),
    trial_end_time: null,
  };
  backup.trials.push(currentTrial);
  saveBackup();
  syncRecord("trials", currentTrial);
  saveStudyProgress("trial");
}

$("#previewBtn").addEventListener("click", async () => {
  if (previewActive) return;
  const task = currentTask();
  if (hasFeedback(task.feedback, "audio")) ensureAudioContext();
  previewActive = true;
  startPoint = null;
  $("#previewBtn").disabled = true;
  touchArea.classList.add("previewing");
  $("#previewDemo").classList.remove("hidden");
  $("#previewStatus").textContent = "Get ready…";
  $("#demoFinger").className = "demo-finger";
  $("#demoTrail").className = "demo-trail";
  await wait(650);
  $("#previewStatus").textContent = "Watch the pattern";
  $("#demoFinger").classList.add("visible");

  for (let index = 0; index < task.actions.length; index += 1) {
    const actionStartedAt = performance.now();
    await demonstrateAction(
      task.actions[index],
      task.feedback,
      task.intervals[index],
    );
    if (index < task.intervals.length) {
      const remaining = task.intervals[index] - (performance.now() - actionStartedAt);
      if (remaining > 0) await wait(remaining);
    }
  }

  await wait(260);
  $("#demoFinger").classList.remove("visible");
  $("#previewStatus").textContent = "Your turn";
  previewEndedAt = now();
  await wait(600);
  $("#previewDemo").classList.add("hidden");
  touchArea.classList.remove("previewing");
  previewActive = false;
  $("#previewBtn").disabled = false;
  $("#resultDetail").textContent = "Now reproduce the pattern in the area above.";
});

async function demonstrateAction(action, feedback, nextInterval) {
  const finger = $("#demoFinger");
  const trail = $("#demoTrail");
  const bounds = touchArea.getBoundingClientRect();
  const centerY = bounds.top + bounds.height * 0.57;
  const startX = bounds.left + bounds.width * (action === "right" ? 0.32 : 0.5);
  finger.className = "demo-finger visible";
  finger.style.left = `${startX - bounds.left}px`;
  finger.style.top = `${centerY - bounds.top}px`;
  trail.className = "demo-trail";

  if (hasFeedback(feedback, "visual")) {
    touchArea.classList.remove("visual-flash");
    void touchArea.offsetWidth;
    touchArea.classList.add("visual-flash");
    setTimeout(() => touchArea.classList.remove("visual-flash"), 240);
  }
  if (hasFeedback(feedback, "audio")) playActionTone(action);
  if (hasFeedback(feedback, "haptic") && navigator.vibrate) {
    navigator.vibrate(25);
  }

  if (action === "tap") {
    finger.classList.add("tapping");
    pulse(startX, centerY);
    await wait(180);
    finger.classList.remove("tapping");
  } else {
    const endX = bounds.left + bounds.width * (action === "left" ? 0.32 : 0.68);
    const distance = endX - startX;
    const dwell = 175;
    const duration = Math.min(
      300,
      Math.max(150, (nextInterval || 500) - dwell - 65),
    );
    trail.style.left = `${Math.min(startX, endX) - bounds.left}px`;
    trail.style.top = `${centerY - bounds.top - 2}px`;
    trail.style.width = `${Math.abs(distance)}px`;
    trail.style.transformOrigin = distance >= 0 ? "left center" : "right center";
    await wait(dwell);
    pulse(startX, centerY);
    trail.classList.add("visible");
    const trailMovement = trail.animate(
      [
        { transform: "scaleX(0)", opacity: 0.2 },
        { transform: "scaleX(1)", opacity: 1 },
      ],
      {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
    const movement = finger.animate(
      [
        { transform: "translate(-50%, -50%) translate(0, 0)", offset: 0 },
        { transform: `translate(-50%, -50%) translate(${distance * 0.58}px, -4px)`, offset: 0.55 },
        { transform: `translate(-50%, -50%) translate(${distance}px, 0)`, offset: 1 },
      ],
      {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
    await Promise.all([movement.finished, trailMovement.finished]);
    finger.style.left = `${endX - bounds.left}px`;
    pulse(endX, centerY);
    finger.classList.remove("visible");
    const trailFade = trail.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 65, easing: "ease-out", fill: "forwards" },
    );
    await trailFade.finished;
    trail.getAnimations().forEach((animation) => animation.cancel());
    trail.className = "demo-trail";
  }
}

function pulse(
  x = innerWidth / 2,
  y = $("#touchArea").getBoundingClientRect().top + 130,
) {
  const bounds = touchArea.getBoundingClientRect();
  const element = $("#pulse");
  element.style.left = `${x - bounds.left}px`;
  element.style.top = `${y - bounds.top}px`;
  element.classList.remove("go");
  void element.offsetWidth;
  element.classList.add("go");
}

function ensureAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function tone(frequency, duration = 0.09) {
  const context = ensureAudioContext();
  if (!context) return;
  const playTone = () => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startedAt = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startedAt);
    gain.gain.setValueAtTime(0.14, startedAt);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      startedAt + duration,
    );
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startedAt);
    oscillator.stop(startedAt + duration);
  };
  if (context.state === "running") {
    playTone();
  } else {
    context.resume().then(playTone).catch(() => {});
  }
}

function swipeTone() {
  const context = ensureAudioContext();
  if (!context) return;
  const playTone = () => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startedAt = context.currentTime;
    const duration = 0.16;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(420, startedAt);
    oscillator.frequency.exponentialRampToValueAtTime(
      920,
      startedAt + duration,
    );
    gain.gain.setValueAtTime(0.001, startedAt);
    gain.gain.linearRampToValueAtTime(0.11, startedAt + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, startedAt + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startedAt);
    oscillator.stop(startedAt + duration);
  };
  if (context.state === "running") {
    playTone();
  } else {
    context.resume().then(playTone).catch(() => {});
  }
}

function playActionTone(action = "tap") {
  if (action === "tap") {
    tone(760, 0.055);
  } else {
    swipeTone();
  }
}

touchArea.addEventListener("pointerdown", (event) => {
  if (previewActive || event.target.closest("button")) return;
  if (hasFeedback(currentTask().feedback, "audio")) ensureAudioContext();
  event.preventDefault();
  touchArea.setPointerCapture(event.pointerId);
  startPoint = { x: event.clientX, y: event.clientY };
});

touchArea.addEventListener("pointerup", (event) => {
  if (previewActive || event.target.closest("button")) return;
  if (!startPoint) return;
  const dx = event.clientX - startPoint.x;
  const dy = event.clientY - startPoint.y;
  let type = "tap";
  if (Math.hypot(dx, dy) > 45) {
    type =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : "vertical";
  }
  addAction(type, event.clientX, event.clientY);
  startPoint = null;
});

function beginAttempt() {
  if (isPractice) practiceAttemptNumber += 1;
  currentAttempt = {
    attempt_id: makeId("AT"),
    trial_id: isPractice ? null : currentTrial.trial_id,
    attempt_number: isPractice
      ? practiceAttemptNumber
      : backup.attempts.filter(
          (attempt) => attempt.trial_id === currentTrial.trial_id,
        ).length + 1,
    similarity_score: null,
    attempt_success: false,
    action_count_correct: null,
    action_type_correct: null,
    action_order_correct: null,
    overall_action_correct: null,
    preview_end_time: previewEndedAt || now(),
    attempt_start_time: now(),
    attempt_end_time: null,
  };
  events = [];
  if (!isPractice) {
    backup.attempts.push(currentAttempt);
    saveBackup();
    syncRecord("attempts", currentAttempt);
  }
  saveStudyProgress(isPractice ? "practice-task" : "trial");
}

function addAction(type, x, y) {
  if (currentAttempt?.attempt_end_time) return;
  if (!currentAttempt) beginAttempt();
  const task = currentTask();
  const action = {
    action_id: makeId("AC"),
    attempt_id: currentAttempt.attempt_id,
    action_index: events.length + 1,
    action_type: type,
    timestamp: now(),
  };
  events.push(action);

  if (!isPractice) {
    backup.actions.push(action);
    saveBackup();
    syncRecord("actions", action);
  }

  if (hasFeedback(task.feedback, "visual") || isPractice) {
    pulse(x, y);
    $("#eventTrail").insertAdjacentHTML(
      "beforeend",
      `<span class="event">${icon(type)} ${actionLabel(type)}</span>`,
    );
  }
  if (hasFeedback(task.feedback, "audio")) {
    playActionTone(type);
  }
  if (hasFeedback(task.feedback, "haptic") && navigator.vibrate) {
    navigator.vibrate(25);
  }

  clearTimeout(endTimer);
  clearInterval(tickTimer);
  const timerStarted = performance.now();
  const timeout = 1300;
  tickTimer = setInterval(() => {
    $("#timer").style.width =
      `${Math.max(0, 100 - ((performance.now() - timerStarted) / timeout) * 100)}%`;
  }, 50);
  endTimer = setTimeout(finishAttempt, timeout);
}

function sameActionTypes(target, actual) {
  if (target.length !== actual.length) return false;
  return [...target].sort().join("|") === [...actual].sort().join("|");
}

function calculateSimilarity(targetIntervals, actualIntervals) {
  if (
    !targetIntervals.length ||
    actualIntervals.length !== targetIntervals.length
  ) {
    return 0;
  }
  const ratios = actualIntervals.map(
    (interval, index) => interval / targetIntervals[index],
  );
  const tempoScale =
    ratios.reduce((total, ratio) => total + ratio, 0) / ratios.length;
  const errors = actualIntervals.map(
    (interval, index) =>
      Math.abs(interval - targetIntervals[index] * tempoScale) /
      (targetIntervals[index] * tempoScale),
  );
  return Math.max(
    0,
    Math.round(
      (1 - errors.reduce((total, error) => total + error, 0) / errors.length) *
        100,
    ),
  );
}

function finishAttempt() {
  clearInterval(tickTimer);
  const task = currentTask();
  const actualIntervals = events
    .slice(1)
    .map((event, index) => event.timestamp - events[index].timestamp);
  const actualActions = events.map((event) => event.action_type);
  const actionCountCorrect = actualActions.length === task.actions.length;
  const actionTypeCorrect = sameActionTypes(task.actions, actualActions);
  const actionOrderCorrect =
    actionCountCorrect &&
    task.actions.every((action, index) => action === actualActions[index]);
  const overallActionCorrect =
    actionCountCorrect && actionTypeCorrect && actionOrderCorrect;
  const similarityScore = calculateSimilarity(
    task.intervals,
    actualIntervals,
  );
  const success =
    overallActionCorrect && similarityScore >= SUCCESS_THRESHOLD;
  const reachedMaximum =
    !success && currentAttempt.attempt_number >= MAX_ATTEMPTS;

  Object.assign(currentAttempt, {
    similarity_score: similarityScore,
    attempt_success: success,
    action_count_correct: actionCountCorrect,
    action_type_correct: actionTypeCorrect,
    action_order_correct: actionOrderCorrect,
    overall_action_correct: overallActionCorrect,
    attempt_end_time: now(),
  });

  if (!isPractice) {
    saveBackup();
    syncRecord("attempts", currentAttempt);
    if (success || reachedMaximum) {
      currentTrial.task_success = success;
      currentTrial.trial_end_time = now();
      saveBackup();
      syncRecord("trials", currentTrial);
    }
  }

  lastResult = {
    attemptId: currentAttempt.attempt_id,
    attemptNumber: currentAttempt.attempt_number,
    attemptEndTime: currentAttempt.attempt_end_time,
    success,
    reachedMaximum,
    similarityScore,
    actualIntervals,
  };
  saveStudyProgress(isPractice ? "practice-task" : "trial");
  displayAttemptResult(lastResult, true);
}

function displayAttemptResult(result, playCue = true) {
  const task = currentTask();
  const {
    success,
    reachedMaximum,
    similarityScore,
    actualIntervals,
    attemptNumber,
  } = result;
  if (playCue) {
    outcomeCue(task.feedback, success, !reachedMaximum);
  } else if (hasFeedback(task.feedback, "visual")) {
    $("#resultCard").classList.add(
      success ? "visual-success" : "visual-failure",
    );
  }
  const intervalSummary = actualIntervals.length
    ? ` Recorded intervals: ${actualIntervals.join(", ")} ms.`
    : "";
  $("#score").textContent = `${similarityScore}%`;
  $("#score").className = success ? "good" : "bad";
  $("#attemptActions").classList.add("hidden");
  $("#attemptActions").classList.remove("double");
  $("#tryAgainBtn").classList.add("hidden");
  $("#skipTrialBtn").classList.add("hidden");
  touchArea.classList.remove("awaiting-decision");

  if (success) {
    $("#resultTitle").textContent = "Pattern recognised";
    $("#resultDetail").textContent = intervalSummary.trim();
    $("#nextTrialBtn").textContent = nextButtonLabel();
    $("#nextTrialBtn").classList.remove("hidden");
  } else if (reachedMaximum) {
    $("#resultTitle").textContent = "Maximum attempts reached";
    $("#resultDetail").textContent =
      `You have reached the maximum number of attempts.${intervalSummary}`;
    $("#attemptActions").classList.remove("hidden");
    $("#attemptActions").classList.add("double");
    $("#tryAgainBtn").classList.remove("hidden");
    $("#skipTrialBtn").classList.remove("hidden");
    touchArea.classList.add("awaiting-decision");
  } else {
    $("#resultTitle").textContent = "Pattern not recognised";
    $("#resultDetail").textContent =
      `This was attempt ${attemptNumber} of ${MAX_ATTEMPTS}. You can try again.${intervalSummary}`;
    $("#attemptActions").classList.remove("hidden");
    $("#tryAgainBtn").classList.remove("hidden");
    touchArea.classList.add("awaiting-decision");
  }
}

function outcomeCue(feedback, success, canRetry = true) {
  if (hasFeedback(feedback, "visual")) {
    $("#resultCard").classList.remove("visual-success", "visual-failure");
    $("#resultCard").classList.add(
      success ? "visual-success" : "visual-failure",
    );
    showVisualFeedback(success, canRetry);
  }
  if (hasFeedback(feedback, "audio")) {
    if (success) {
      tone(660, 0.1);
      setTimeout(() => tone(880, 0.14), 110);
    } else {
      tone(140, 0.24);
    }
  }
  if (hasFeedback(feedback, "haptic") && navigator.vibrate) {
    navigator.vibrate(success ? [55, 45, 55] : 220);
  }
}

function showVisualFeedback(success, canRetry = true) {
  const overlay = $("#visualFeedbackOverlay");
  clearTimeout(visualFeedbackTimer);
  overlay.classList.remove("hidden", "success", "failure", "show");
  overlay.classList.add(success ? "success" : "failure");
  $("#visualFeedbackSymbol").textContent = success ? "✓" : "×";
  $("#visualFeedbackLabel").textContent = success
    ? "Success"
    : canRetry
      ? "Try again"
      : "Maximum attempts reached";
  void overlay.offsetWidth;
  overlay.classList.add("show");
  visualFeedbackTimer = setTimeout(() => {
    overlay.classList.remove("show");
    setTimeout(() => overlay.classList.add("hidden"), 180);
  }, success ? 950 : 820);
}

function nextButtonLabel() {
  if (isPractice) {
    return practiceIndex + 1 < practiceTasks.length
      ? "Next practice task"
      : "Finish practice";
  }
  return trialIndex + 1 < currentLevel().tasks.length
    ? "Next task"
    : "Continue";
}

function resetAttempt() {
  clearTimeout(endTimer);
  clearInterval(tickTimer);
  events = [];
  currentAttempt = null;
  $("#attemptActions").classList.add("hidden");
  $("#attemptActions").classList.remove("double");
  $("#tryAgainBtn").classList.add("hidden");
  $("#skipTrialBtn").classList.add("hidden");
  $("#nextTrialBtn").classList.add("hidden");
  touchArea.classList.remove("awaiting-decision");
  $("#eventTrail").innerHTML = "";
  $("#timer").style.width = "0";
  $("#resultCard").classList.remove("visual-success", "visual-failure");
  $("#resultTitle").textContent = "Ready";
  $("#resultDetail").textContent =
    "Preview the pattern, then perform it in the area above.";
  $("#score").textContent = "—";
  $("#score").className = "";
}

function advanceAfterTask() {
  lastResult = null;
  currentTrial = null;
  if (isPractice) {
    practiceIndex += 1;
    if (practiceIndex < practiceTasks.length) {
      renderTrial();
    } else {
      isPractice = false;
      blockIndex = 0;
      levelIndex = 0;
      trialIndex = 0;
      renderBlockIntro();
    }
    return;
  }

  trialIndex += 1;
  if (trialIndex < currentLevel().tasks.length) {
    renderTrial();
  } else {
    renderSubBlockSurvey();
  }
}

$("#tryAgainBtn").addEventListener("click", () => {
  lastResult = null;
  resetAttempt();
  saveStudyProgress(isPractice ? "practice-task" : "trial");
});
$("#nextTrialBtn").addEventListener("click", advanceAfterTask);
$("#skipTrialBtn").addEventListener("click", advanceAfterTask);

function ratingScale(name, left, middle, right) {
  const choices = Array.from(
    { length: 7 },
    (_, index) =>
      `<label><input required type="radio" name="${name}" value="${index + 1}">` +
      `<span>${index + 1}</span></label>`,
  ).join("");
  return `
    <div class="scale seven">${choices}</div>
    <div class="anchors three"><span>1 = ${left}</span><span>4 = ${middle}</span><span>7 = ${right}</span></div>`;
}

function renderSubBlockSurvey() {
  const block = currentBlock();
  const level = currentLevel();
  updateStage(block.stage);
  show("#subBlockSurveyView");
  $("#subBlockSurveyView").innerHTML = `
    <form id="subBlockForm" class="card survey">
      <div class="survey-head">
        <div>
          <span class="eyebrow">${level.name} complete</span>
          <h2>Short rating</h2>
        </div>
        <span class="question-count">${level.questions.length} ${level.questions.length === 1 ? "question" : "questions"}</span>
      </div>
      <p class="survey-intro">Answer based only on the tasks you have just completed.</p>
      ${level.questions
        .map(
          (question, questionIndex) => `
            <div class="question">
              <label>Question ${questionIndex + 1}: ${question.text}</label>
              ${ratingScale(
                question.name,
                question.left,
                question.middle,
                question.right,
              )}
            </div>`,
        )
        .join("")}
      <button class="primary wide">Save and continue</button>
    </form>`;
  $("#subBlockForm").addEventListener("submit", submitSubBlockSurvey);
  saveStudyProgress("sub-block-survey");
}

async function submitSubBlockSurvey(event) {
  event.preventDefault();
  const block = currentBlock();
  const level = currentLevel();
  const formData = new FormData(event.target);
  const ratings = {};
  level.questions.forEach((question) => {
    ratings[question.name] = Number(formData.get(question.name));
  });
  const row = {
    survey_response_id: makeId("SV"),
    user_id: user.user_id,
    survey_type: "SUB_BLOCK_RATING",
    block_id: block.id,
    block_number: blockIndex + 1,
    responses: {
      iv: block.iv,
      level_id: level.id,
      level_value: level.value,
      ratings,
    },
    submitted_at: new Date().toISOString(),
  };
  backup.survey_responses.push(row);
  saveBackup();
  await syncRecord("survey_responses", row);

  if (levelIndex + 1 < block.levels.length) {
    levelIndex += 1;
    trialIndex = 0;
    renderTrial();
  } else {
    renderBlockSurvey();
  }
}

function tlxSlider(question) {
  return `
    <div class="slider-wrap">
      <input
        type="range"
        name="${question.name}"
        min="0"
        max="100"
        step="5"
        value="50"
        data-output="${question.name}_value"
      >
      <output id="${question.name}_value">50</output>
    </div>
    <div class="anchors"><span>${question.left}</span><span>${question.right}</span></div>`;
}

function renderBlockSurvey() {
  const block = currentBlock();
  updateStage(block.stage);
  show("#blockSurveyView");
  $("#blockSurveyView").innerHTML = `
    <form id="blockForm" class="card survey">
      <div class="survey-head">
        <div>
          <span class="eyebrow">Block ${blockIndex + 1} complete</span>
          <h2>Workload rating</h2>
        </div>
        <span class="question-count">6 questions</span>
      </div>
      <p class="survey-intro">
        Rate your experience across the entire “${block.name}” block.
      </p>
      ${tlxQuestions
        .map(
          (question) => `
            <div class="question">
              <label>${question.text}</label>
              ${tlxSlider(question)}
            </div>`,
        )
        .join("")}
      <button class="primary wide">Save and continue</button>
    </form>`;
  document.querySelectorAll("#blockForm input[type='range']").forEach((input) => {
    input.addEventListener("input", () => {
      $(`#${input.dataset.output}`).value = input.value;
    });
  });
  $("#blockForm").addEventListener("submit", submitBlockSurvey);
  saveStudyProgress("block-survey");
}

async function submitBlockSurvey(event) {
  event.preventDefault();
  const block = currentBlock();
  const formData = new FormData(event.target);
  const responses = {};
  tlxQuestions.forEach((question) => {
    responses[question.name] = Number(formData.get(question.name));
  });
  const row = {
    survey_response_id: makeId("SV"),
    user_id: user.user_id,
    survey_type: "NASA_TLX",
    block_id: block.id,
    block_number: blockIndex + 1,
    responses,
    submitted_at: new Date().toISOString(),
  };
  backup.survey_responses.push(row);
  saveBackup();
  await syncRecord("survey_responses", row);

  if (blockIndex + 1 < blocks.length) {
    blockIndex += 1;
    levelIndex = 0;
    trialIndex = 0;
    renderBlockIntro();
  } else {
    updateStage("complete");
    show("#completeView");
    saveStudyProgress("complete");
  }
}

$("#signOutBtn").addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  user = null;
  authToken = null;
  $("#username").value = "";
  $("#password").value = "";
  $("#studySteps").classList.add("hidden");
  show("#authView");
});

function restoreSignedInSession() {
  try {
    const savedSession = JSON.parse(
      localStorage.getItem(SESSION_KEY) || "null",
    );
    if (
      !savedSession?.user?.user_id ||
      !savedSession?.user?.participant_number ||
      !savedSession?.token
    ) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    user = savedSession.user;
    authToken = savedSession.token;
    backup.users = [user];
    startStudy(loadStudyProgress());
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
}

restoreSignedInSession();
