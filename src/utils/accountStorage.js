const ACCOUNTS_KEY = 'saved_accounts';

const normalizeUser = (user) => ({
  _id: user?._id,
  username: user?.username || '',
  name: user?.name || '',
  email: user?.email || '',
  profile: user?.profile || '',
  isPrivate: Boolean(user?.isPrivate)
});

export const getSavedAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveCurrentAccount = (user) => {
  if (!user?._id) return;
  const normalized = normalizeUser(user);
  const accounts = getSavedAccounts();
  const withoutCurrent = accounts.filter((acc) => acc._id !== normalized._id);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([normalized, ...withoutCurrent]));
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeSavedAccount = (userId) => {
  const accounts = getSavedAccounts().filter((acc) => acc._id !== userId);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};
