/**
 * Easy-Lab-Plotter Document API
 * Vercel Serverless Function for HTML to PDF conversion
 * 
 * Node.js 엔드포인트: POST /api/document
 * 
 * Uses puppeteer-core + @sparticuz/chromium for Vercel optimization
 */

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET 요청 처리 (정보 제공)
    if (req.method === 'GET') {
        return res.status(200).json({
            message: 'Document API is running',
            version: '2.0.0',
            usage: 'Send POST request with HTML and options',
            example: {
                html: '<html><body><h1>Lab Report</h1></body></html>',
                options: {
                    format: 'A4',
                    margin: {
                        top: '1cm',
                        right: '1cm',
                        bottom: '1cm',
                        left: '1cm'
                    }
                }
            }
        });
    }

    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({
            status: 'error',
            message: 'Method not allowed. Use POST.'
        });
    }

    let browser = null;

    try {
        const { html, options = {} } = req.body;

        // HTML 검증
        if (!html || typeof html !== 'string') {
            return res.status(400).json({
                status: 'error',
                message: 'HTML content is required'
            });
        }

        // Puppeteer 브라우저 시작
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        // HTML 콘텐츠 설정
        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });

        // PDF 옵션 설정
        const pdfOptions = {
            format: options.format || 'A4',
            printBackground: true,
            margin: options.margin || {
                top: '1cm',
                right: '1cm',
                bottom: '1cm',
                left: '1cm'
            }
        };

        // PDF 생성
        const pdf = await page.pdf(pdfOptions);

        await browser.close();
        browser = null;

        // PDF 응답
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="lab-report-${Date.now()}.pdf"`);
        res.send(pdf);

    } catch (error) {
        // 브라우저 정리
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }

        console.error('PDF generation error:', error);

        return res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to generate PDF',
            type: error.constructor.name
        });
    }
};
