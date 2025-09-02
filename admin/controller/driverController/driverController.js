const Driver = require('../../../driver/modal/driver');

// @desc    Get all drivers (Admin only)
// @route   GET /api/admin/drivers
// @access  Private (Admin)
const getAllDrivers = async (req, res) => {
  try {
    const { status, step, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status === 'active') {
      query.isActive = true;
      query.isBlocked = false;
    } else if (status === 'blocked') {
      query.isBlocked = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'pending') {
      query.status = 'pending';
    } else if (status === 'approved') {
      query.status = 'approved';
    } else if (status === 'rejected') {
      query.status = 'rejected';
    }

    if (step) {
      query.registrationStep = parseInt(step);
    }

    const drivers = await Driver.find(query)
      .select('-otp -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Driver.countDocuments(query);

    res.status(200).json({
      success: true,
      count: drivers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: drivers.map(driver => ({
        ...driver.completeProfile,
        registrationProgress: driver.registrationProgress
      }))
    });

  } catch (error) {
    console.error('Get All Drivers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching drivers',
      error: error.message
    });
  }
};

// @desc    Get driver by ID (Admin only)
// @route   GET /api/admin/drivers/:id
// @access  Private (Admin)
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id).select('-otp -otpExpiry');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...driver.completeProfile,
        registrationProgress: driver.registrationProgress,
        // Include all registration details
        bankDetails: {
          bankName: driver.bankName,
          accountNumber: driver.accountNumber,
          ifscCode: driver.ifscCode,
          branch: driver.branch,
          passbookImage: driver.passbookImage,
          panCardImage: driver.panCardImage
        },
        aadharDetails: {
          aadharNumber: driver.aadharNumber,
          aadharFrontImage: driver.aadharFrontImage,
          aadharBackImage: driver.aadharBackImage
        },
        drivingLicenseDetails: {
          drivingLicenseNumber: driver.drivingLicenseNumber,
          dlFrontImage: driver.dlFrontImage,
          dlBackImage: driver.dlBackImage
        },
        vehicleDetails: {
          vehicleNumber: driver.vehicleNumber,
          vehicleType: driver.vehicleType,
          vehicleModel: driver.vehicleModel,
          vehicleColor: driver.vehicleColor,
          vehicleRegistrationImage: driver.vehicleRegistrationImage
        },
        additionalDocuments: {
          insuranceImage: driver.insuranceImage,
          fitnessCertificateImage: driver.fitnessCertificateImage,
          pollutionCertificateImage: driver.pollutionCertificateImage
        }
      }
    });

  } catch (error) {
    console.error('Get Driver Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver',
      error: error.message
    });
  }
};

// @desc    Approve driver (Admin only)
// @route   PUT /api/admin/drivers/:id/approve
// @access  Private (Admin)
const approveDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!driver.isRegistrationComplete) {
      return res.status(400).json({
        success: false,
        message: 'Driver registration is not complete'
      });
    }

    if (driver.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Driver is already approved'
      });
    }

    driver.isApproved = true;
    driver.isActive = true;
    driver.status = 'approved';
    driver.approvedBy = req.user.id;
    driver.approvedAt = new Date();

    await driver.save();

    res.status(200).json({
      success: true,
      message: 'Driver approved successfully',
      data: driver.completeProfile
    });

  } catch (error) {
    console.error('Approve Driver Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving driver',
      error: error.message
    });
  }
};

// @desc    Reject driver (Admin only)
// @route   PUT /api/admin/drivers/:id/reject
// @access  Private (Admin)
const rejectDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason must be at least 10 characters'
      });
    }

    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (driver.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Driver is already rejected'
      });
    }

    driver.isApproved = false;
    driver.isActive = false;
    driver.status = 'rejected';
    driver.rejectionReason = reason.trim();

    await driver.save();

    res.status(200).json({
      success: true,
      message: 'Driver rejected successfully',
      data: driver.completeProfile
    });

  } catch (error) {
    console.error('Reject Driver Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting driver',
      error: error.message
    });
  }
};

// @desc    Block driver (Admin only)
// @route   PUT /api/admin/drivers/:id/block
// @access  Private (Admin)
const blockDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Block reason must be at least 10 characters'
      });
    }

    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (driver.isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'Driver is already blocked'
      });
    }

    driver.isBlocked = true;
    driver.blockedReason = reason.trim();
    await driver.save();

    res.status(200).json({
      success: true,
      message: 'Driver blocked successfully',
      data: driver.completeProfile
    });

  } catch (error) {
    console.error('Block Driver Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking driver',
      error: error.message
    });
  }
};

// @desc    Unblock driver (Admin only)
// @route   PUT /api/admin/drivers/:id/unblock
// @access  Private (Admin)
const unblockDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!driver.isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'Driver is not blocked'
      });
    }

    driver.isBlocked = false;
    driver.blockedReason = '';
    await driver.save();

    res.status(200).json({
      success: true,
      message: 'Driver unblocked successfully',
      data: driver.completeProfile
    });

  } catch (error) {
    console.error('Unblock Driver Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unblocking driver',
      error: error.message
    });
  }
};

// @desc    Toggle driver status (Admin only)
// @route   PUT /api/admin/drivers/:id/toggle-status
// @access  Private (Admin)
const toggleDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    driver.isActive = !driver.isActive;
    await driver.save();

    res.status(200).json({
      success: true,
      message: `Driver ${driver.isActive ? 'activated' : 'deactivated'} successfully`,
      data: driver.completeProfile
    });

  } catch (error) {
    console.error('Toggle Driver Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling driver status',
      error: error.message
    });
  }
};

// @desc    Get driver statistics for dashboard
// @route   GET /api/admin/driver-stats
// @access  Private (Admin)
const getDriverStats = async (req, res) => {
  try {
    const totalDrivers = await Driver.countDocuments();
    const activeDrivers = await Driver.countDocuments({ isActive: true, isBlocked: false });
    const blockedDrivers = await Driver.countDocuments({ isBlocked: true });
    const inactiveDrivers = await Driver.countDocuments({ isActive: false });
    const pendingDrivers = await Driver.countDocuments({ status: 'pending' });
    const approvedDrivers = await Driver.countDocuments({ status: 'approved' });
    const rejectedDrivers = await Driver.countDocuments({ status: 'rejected' });
    const newDriversToday = await Driver.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    // Registration step statistics
    const stepStats = {};
    for (let step = 1; step <= 7; step++) {
      stepStats[`step${step}`] = await Driver.countDocuments({ registrationStep: step });
    }

    res.status(200).json({
      success: true,
      data: {
        total: totalDrivers,
        active: activeDrivers,
        blocked: blockedDrivers,
        inactive: inactiveDrivers,
        pending: pendingDrivers,
        approved: approvedDrivers,
        rejected: rejectedDrivers,
        newToday: newDriversToday,
        stepStats
      }
    });

  } catch (error) {
    console.error('Get Driver Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllDrivers,
  getDriverById,
  approveDriver,
  rejectDriver,
  blockDriver,
  unblockDriver,
  toggleDriverStatus,
  getDriverStats
};
