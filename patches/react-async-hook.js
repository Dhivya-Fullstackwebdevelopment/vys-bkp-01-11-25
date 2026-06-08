const useAsync = (fn, deps) => {
  return { result: null, loading: false, error: null };
};

module.exports = { useAsync };