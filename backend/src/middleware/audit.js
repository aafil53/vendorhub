module.exports = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${req.user?.id || 'anonymous'} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};
