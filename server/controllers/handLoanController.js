const HandLoan = require('../models/HandLoan');
const { generateHandLoanId } = require('../utils/idGenerator');
const { calculateAccruedInterest } = require('../utils/calculations');
const { getUserIdForFilter } = require('../utils/authHelper');

exports.getAllHandLoans = async (req, res) => {
    try {
        const { status } = req.query;
        const userId = await getUserIdForFilter(req);

        const filter = { user: userId };

        if (status && status !== 'All') {
            filter.status = status;
        } else if (!status) {
            filter.status = 'Active';
        }

        const loans = await HandLoan.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: loans });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getHandLoanById = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        const loan = await HandLoan.findOne({ loanId: req.params.loanId, user: userId });
        if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

        // Calculate current interest accrued for display?
        // Spec doesn't strictly demand it here, but nice to have.

        res.json({ success: true, data: loan });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createHandLoan = async (req, res) => {
    try {
        const data = req.body;
        const loanId = await generateHandLoanId();

        const newLoan = new HandLoan({
            loanId,
            ...data,
            remainingBalance: data.principalAmount, // Start with full balance
            totalRepaid: 0,
            interestDue: 0,
            user: req.user._id // Assign ownership
        });

        await newLoan.save();
        res.json({ success: true, message: 'Hand loan added successfully', data: newLoan });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateHandLoan = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // If principalAmount is being updated, sync remainingBalance to match
        // because the dashboard and simulator both read remainingBalance for outstanding amount
        if (updateData.principalAmount !== undefined) {
            updateData.remainingBalance = parseFloat(updateData.principalAmount);
        }

        const updated = await HandLoan.findOneAndUpdate(
            { loanId: req.params.loanId, user: req.user._id }, // Ensure ownership
            updateData,
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Loan not found' });

        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteHandLoan = async (req, res) => {
    try {
        const updated = await HandLoan.findOneAndUpdate(
            { loanId: req.params.loanId, user: req.user._id }, // Ensure ownership
            { status: 'Closed' },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Loan not found' });

        res.json({ success: true, message: 'Hand loan closed', data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
