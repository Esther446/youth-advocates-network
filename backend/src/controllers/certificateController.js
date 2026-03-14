const PDFDocument = require('pdfkit');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Download/Generate Certificate for a course
// @route   GET /api/v1/certificates/:courseId
// @access  Private (Role: any enrolled)
exports.generateCertificate = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;

        // Find enrollment
        const enrollment = await Enrollment.findOne({
            user: req.user.id,
            course: courseId
        });

        if (!enrollment || enrollment.progress !== 100) {
            return res.status(403).json({ success: false, message: 'Course not 100% completed' });
        }

        // Find or create certificate
        let certificate = await Certificate.findOne({
            user: req.user.id,
            course: courseId
        });

        if (!certificate) {
            certificate = await Certificate.create({
                user: req.user.id,
                course: courseId,
                completionDate: enrollment.completionDate || Date.now()
            });
        }

        if (certificate.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Certificate has been revoked' });
        }

        // Populate user and course details
        const user = await User.findById(req.user.id);
        const course = await Course.findById(courseId);

        // Generate PDF
        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Certificate_${certificate.certificateId}.pdf"`);

        doc.pipe(res);

        // Styling
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');

        // Border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#06b6d4');
        doc.lineWidth(3).rect(35, 35, doc.page.width - 70, doc.page.height - 70).stroke('#0891b2');

        // Content
        doc.font('Helvetica-Bold').fontSize(48).fillColor('#06b6d4')
            .text('Certificate of Completion', 0, 120, { align: 'center' });

        doc.font('Helvetica').fontSize(24).fillColor('#64748b')
            .text('This proudly certifies that', 0, 200, { align: 'center' });

        doc.font('Helvetica-Oblique').fontSize(36).fillColor('#1e293b')
            .text(user.name, 0, 240, { align: 'center' });

        doc.font('Helvetica').fontSize(20).fillColor('#64748b')
            .text('has successfully completed the course', 0, 300, { align: 'center' });

        doc.font('Helvetica-Bold').fontSize(28).fillColor('#1e293b')
            .text(course.title, 0, 340, { align: 'center' });

        doc.font('Helvetica').fontSize(16).fillColor('#64748b')
            .text(`Date of Completion: ${new Date(certificate.completionDate).toLocaleDateString()}`, 0, 420, { align: 'center' });

        doc.font('Helvetica-Bold').fontSize(14).fillColor('#06b6d4')
            .text(`Certificate ID: ${certificate.certificateId}`, 0, 460, { align: 'center' });

        doc.font('Helvetica').fontSize(12).fillColor('#94a3b8')
            .text('Youth Action Network (YAN) Rwanda', 0, 520, { align: 'center' });

        doc.end();
    } catch (error) {
        next(error);
    }
};

// @desc    Verify a certificate by ID
// @route   GET /api/v1/certificates/verify/:certificateId
// @access  Public
exports.verifyCertificate = async (req, res, next) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({ certificateId, status: 'active' })
            .populate('user', 'name')
            .populate('course', 'title');

        if (!certificate) {
            return res.status(404).json({ valid: false });
        }

        res.status(200).json({
            valid: true,
            user: certificate.user.name,
            course: certificate.course.title,
            completionDate: certificate.completionDate
        });
    } catch (error) {
        next(error);
    }
};
