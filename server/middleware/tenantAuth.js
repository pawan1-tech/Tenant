const tenantAuth = (req, res, next) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({
      success: false,
      message: 'Tenant information not found in token'
    });
  }

  // Add tenant context to request
  req.tenantId = req.user.tenantId;
  req.tenantSlug = req.user.tenantSlug;
  req.tenantName = req.user.tenantName;
  req.tenantPlan = req.user.tenantPlan;

  next();
};

module.exports = { tenantAuth };