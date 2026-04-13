import axios from 'axios';

const CACHE_KEY = 'profile_cache_v1';
const TTL_MS = 5 * 60 * 1000;

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch (_e) {
    return {};
  }
};

const writeCache = (cache) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

export const getCachedProfile = (userId) => {
  if (!userId) return null;
  const cache = readCache();
  const entry = cache[userId];
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) return null;
  return entry.data;
};

export const setCachedProfile = (user) => {
  if (!user?._id) return;
  const cache = readCache();
  cache[user._id] = { data: user, ts: Date.now() };
  writeCache(cache);
};

export const fetchProfileByIdCached = async (userId) => {
  const cached = getCachedProfile(userId);
  if (cached) return cached;
  const response = await axios.get(`${process.env.REACT_APP_SERVER}/user/${userId}`);
  setCachedProfile(response.data);
  return response.data;
};
