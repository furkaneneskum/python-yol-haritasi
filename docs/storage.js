/** GitHub Pages için tarayıcı localStorage backend */
const ROADMAP_STORAGE_KEY = "python_yol_data_v1";

function roadmapTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function roadmapYesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function roadmapGetRankTitle(xp) {
  if (xp >= 1500) return "Usta Yazılımcı 👑";
  if (xp >= 500) return "Gelişen Yazılımcı 📘";
  return "Yeni Başlayan 🐍";
}

function roadmapStatsToDict(stats) {
  const xp = stats.total_xp;
  return {
    streak_count: stats.streak_count,
    last_active_date: stats.last_active_date,
    total_xp: xp,
    user_level: stats.user_level,
    rank_title: roadmapGetRankTitle(xp),
    xp_to_next_level: xp % 500 !== 0 ? 500 - (xp % 500) : 500,
    level_progress_pct: (xp % 500) / 5,
  };
}

function roadmapCreateInitialState() {
  return {
    topics: ROADMAP_DEFAULT_TOPICS.map((topic, index) => ({
      id: index + 1,
      title: topic.title,
      duration: topic.duration,
      is_completed: false,
      notes: "",
      time_spent: 0,
      resources: roadmapResourcesForIndex(index),
    })),
    stats: {
      streak_count: 0,
      last_active_date: "",
      total_xp: 0,
      user_level: 1,
    },
    activity: {},
  };
}

function roadmapLoadState() {
  try {
    const raw = localStorage.getItem(ROADMAP_STORAGE_KEY);
    if (!raw) return roadmapCreateInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed?.topics?.length) return roadmapCreateInitialState();
    return parsed;
  } catch {
    return roadmapCreateInitialState();
  }
}

function roadmapSaveState(state) {
  localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(state));
}

function roadmapUpdateStreak(state) {
  const today = roadmapTodayIso();
  const stats = state.stats;
  if (stats.last_active_date === today) return;

  if (stats.last_active_date === roadmapYesterdayIso()) {
    stats.streak_count += 1;
  } else {
    stats.streak_count = 1;
  }
  stats.last_active_date = today;
}

function roadmapAddXp(state, amount) {
  if (amount <= 0) return roadmapStatsToDict(state.stats);
  roadmapUpdateStreak(state);
  const stats = state.stats;
  stats.total_xp += amount;
  stats.user_level = Math.floor(stats.total_xp / 500) + 1;
  return roadmapStatsToDict(stats);
}

function roadmapAddDailyMinutes(state, minutes) {
  if (minutes <= 0) return;
  const today = roadmapTodayIso();
  state.activity[today] = (state.activity[today] || 0) + minutes;
}

function roadmapGetActivityMap(state, days = 30) {
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, minutes: state.activity[key] || 0 });
  }
  return result;
}

function roadmapFindTopic(state, topicId) {
  return state.topics.find((t) => t.id === topicId) || null;
}

const RoadmapStorage = {
  listTopics() {
    const state = roadmapLoadState();
    return state.topics.map((t) => ({ ...t }));
  },

  getStats() {
    return roadmapStatsToDict(roadmapLoadState().stats);
  },

  getActivity() {
    return roadmapGetActivityMap(roadmapLoadState(), 30);
  },

  updateCompletion(topicId, isCompleted) {
    const state = roadmapLoadState();
    const topic = roadmapFindTopic(state, topicId);
    if (!topic) throw new Error("Konu bulunamadı");

    const wasCompleted = topic.is_completed;
    topic.is_completed = Boolean(isCompleted);

    let xpGained = 0;
    let stats;
    if (isCompleted && !wasCompleted) {
      stats = roadmapAddXp(state, 100);
      xpGained = 100;
    } else {
      stats = roadmapStatsToDict(state.stats);
    }

    roadmapSaveState(state);
    return { ...topic, xp_gained: xpGained, stats };
  },

  updateNotes(topicId, notes) {
    const state = roadmapLoadState();
    const topic = roadmapFindTopic(state, topicId);
    if (!topic) throw new Error("Konu bulunamadı");
    topic.notes = notes;
    roadmapSaveState(state);
    return { ...topic };
  },

  updateTime(topicId, seconds, mode = "add") {
    const state = roadmapLoadState();
    const topic = roadmapFindTopic(state, topicId);
    if (!topic) throw new Error("Konu bulunamadı");

    if (mode === "add") {
      topic.time_spent += seconds;
    } else if (mode === "set") {
      topic.time_spent = seconds;
    } else {
      throw new Error("mode 'add' veya 'set' olmalı");
    }

    let xpGained = 0;
    if (mode === "add" && seconds > 0) {
      const minutes = Math.floor(seconds / 60);
      if (minutes > 0) {
        xpGained = minutes * 10;
        roadmapAddXp(state, xpGained);
        roadmapAddDailyMinutes(state, minutes);
      } else if (seconds >= 30) {
        roadmapAddDailyMinutes(state, 1);
      }
    }

    const stats = roadmapStatsToDict(state.stats);
    roadmapSaveState(state);
    return { ...topic, xp_gained: xpGained, stats };
  },
};

window.RoadmapStorage = RoadmapStorage;
