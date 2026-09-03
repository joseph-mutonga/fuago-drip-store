/**
 * Report Controller
 * Handles sales reports and analytics
 */

const ReportModel = require('../models/Report');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

class ReportController {
    /**
     * Get daily sales report
     */
    static async getDailySalesReport(req, res) {
        try {
            const { date } = req.query;

            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: 'Date is required'
                });
            }

            const report = await ReportModel.getDailySalesReport(date);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Get daily sales report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate daily sales report',
                error: error.message
            });
        }
    }

    /**
     * Get sales report by date range
     */
    static async getSalesReportByDateRange(req, res) {
        try {
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    message: 'start_date and end_date are required'
                });
            }

            const report = await ReportModel.getSalesReportByDateRange(start_date, end_date);

            res.json({
                success: true,
                count: report.length,
                data: report
            });
        } catch (error) {
            console.error('Get sales report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate sales report',
                error: error.message
            });
        }
    }

    /**
     * Get monthly sales report
     */
    static async getMonthlySalesReport(req, res) {
        try {
            const { year, month } = req.query;

            if (!year || !month) {
                return res.status(400).json({
                    success: false,
                    message: 'year and month are required'
                });
            }

            const report = await ReportModel.getMonthlySalesReport(year, month);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Get monthly sales report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate monthly sales report',
                error: error.message
            });
        }
    }

    /**
     * Get product sales report
     */
    static async getProductSalesReport(req, res) {
        try {
            const { start_date, end_date } = req.query;
            const report = await ReportModel.getProductSalesReport(start_date, end_date);

            res.json({
                success: true,
                count: report.length,
                data: report
            });
        } catch (error) {
            console.error('Get product sales report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate product sales report',
                error: error.message
            });
        }
    }

    /**
     * Get customer sales report
     */
    static async getCustomerSalesReport(req, res) {
        try {
            const { start_date, end_date } = req.query;
            const report = await ReportModel.getCustomerSalesReport(start_date, end_date);

            res.json({
                success: true,
                count: report.length,
                data: report
            });
        } catch (error) {
            console.error('Get customer sales report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate customer sales report',
                error: error.message
            });
        }
    }

    /**
     * Get top selling products
     */
    static async getTopSellingProducts(req, res) {
        try {
            const { limit, start_date, end_date } = req.query;
            const report = await ReportModel.getTopSellingProducts(
                limit ? parseInt(limit) : 10,
                start_date,
                end_date
            );

            res.json({
                success: true,
                count: report.length,
                data: report
            });
        } catch (error) {
            console.error('Get top selling products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate top selling products report',
                error: error.message
            });
        }
    }

    /**
     * Get top customers
     */
    static async getTopCustomers(req, res) {
        try {
            const { limit, start_date, end_date } = req.query;
            const report = await ReportModel.getTopCustomers(
                limit ? parseInt(limit) : 10,
                start_date,
                end_date
            );

            res.json({
                success: true,
                count: report.length,
                data: report
            });
        } catch (error) {
            console.error('Get top customers error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate top customers report',
                error: error.message
            });
        }
    }

    /**
     * Get delivery performance report
     */
    static async getDeliveryPerformanceReport(req, res) {
        try {
            const { start_date, end_date } = req.query;
            const report = await ReportModel.getDeliveryPerformanceReport(start_date, end_date);

            res.json({
                success: true,
                count: report.length,
                data: report
            });
        } catch (error) {
            console.error('Get delivery performance report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate delivery performance report',
                error: error.message
            });
        }
    }

    /**
     * Get payment method report
     */
    static async getPaymentMethodReport(req, res) {
        try {
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    message: 'start_date and end_date are required'
                });
            }

            const report = await ReportModel.getPaymentMethodReport(start_date, end_date);

            res.json({
                success: true,
                count: report.length,
                data: report
            });
        } catch (error) {
            console.error('Get payment method report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate payment method report',
                error: error.message
            });
        }
    }

    /**
     * Get dashboard summary
     */
    static async getDashboardSummary(req, res) {
        try {
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    message: 'start_date and end_date are required'
                });
            }

            const summary = await ReportModel.getDashboardSummary(start_date, end_date);

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Get dashboard summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate dashboard summary',
                error: error.message
            });
        }
    }

    /**
     * Export report to CSV
     */
    static async exportToCSV(req, res) {
        try {
            const { report_type, start_date, end_date } = req.query;

            let data;
            let filename;

            switch (report_type) {
                case 'sales':
                    data = await ReportModel.getSalesReportByDateRange(start_date, end_date);
                    filename = `sales_report_${start_date}_to_${end_date}.csv`;
                    break;
                case 'products':
                    data = await ReportModel.getProductSalesReport(start_date, end_date);
                    filename = `product_sales_report.csv`;
                    break;
                case 'customers':
                    data = await ReportModel.getCustomerSalesReport(start_date, end_date);
                    filename = `customer_sales_report.csv`;
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid report type'
                    });
            }

            const parser = new Parser();
            const csv = parser.parse(data);

            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csv);
        } catch (error) {
            console.error('Export to CSV error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export report',
                error: error.message
            });
        }
    }
}

module.exports = ReportController;
