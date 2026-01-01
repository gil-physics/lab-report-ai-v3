/**
 * Lab Report AI - Word Document Generation API
 * Generates Word documents from templates + analysis results
 * 
 * POST /api/generate-report
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            status: 'error',
            message: 'Method not allowed. Use POST.'
        });
    }

    try {
        const { template, analysis, data } = req.body;

        // 데이터 검증
        if (!analysis) {
            return res.status(400).json({
                status: 'error',
                message: 'Analysis results are required'
            });
        }

        // Word 문서 생성
        const sections = [];

        // 제목
        sections.push(
            new Paragraph({
                text: "물리 실험 보고서",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            })
        );

        // 템플릿 제목
        if (template && template !== 'none') {
            const templateName = template.replace(/_/g, ' ');
            sections.push(
                new Paragraph({
                    text: templateName,
                    heading: HeadingLevel.HEADING_2,
                    alignment: AlignmentType.CENTER,
                })
            );
        }

        // 빈 줄
        sections.push(new Paragraph({ text: "" }));

        // 분석 결과 섹션
        sections.push(
            new Paragraph({
                text: "1. 회귀 분석 결과",
                heading: HeadingLevel.HEADING_2,
            })
        );

        sections.push(new Paragraph({ text: "" }));

        // 최적 모델
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "최적 모델: ",
                        bold: true,
                    }),
                    new TextRun({
                        text: analysis.model || "Unknown",
                    }),
                ],
            })
        );

        // 수식
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "회귀 수식: ",
                        bold: true,
                    }),
                    new TextRun({
                        text: analysis.equation || "N/A",
                    }),
                ],
            })
        );

        // R²
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "결정계수 (R²): ",
                        bold: true,
                    }),
                    new TextRun({
                        text: analysis.r_squared != null ? analysis.r_squared.toFixed(4) : "N/A",
                    }),
                ],
            })
        );

        // Adjusted R²
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "조정된 결정계수 (Adj R²): ",
                        bold: true,
                    }),
                    new TextRun({
                        text: analysis.adj_r_squared != null ? analysis.adj_r_squared.toFixed(4) : "N/A",
                    }),
                ],
            })
        );

        // AIC
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "AIC: ",
                        bold: true,
                    }),
                    new TextRun({
                        text: analysis.aic != null ? analysis.aic.toFixed(2) : "N/A",
                    }),
                ],
            })
        );

        sections.push(new Paragraph({ text: "" }));

        // 파라미터
        if (analysis.parameters && analysis.parameters.length > 0) {
            sections.push(
                new Paragraph({
                    text: "2. 모델 파라미터",
                    heading: HeadingLevel.HEADING_2,
                })
            );

            sections.push(new Paragraph({ text: "" }));

            analysis.parameters.forEach((param, index) => {
                sections.push(
                    new Paragraph({
                        text: `파라미터 ${index + 1}: ${param.toFixed(6)}`,
                    })
                );
            });

            sections.push(new Paragraph({ text: "" }));
        }

        // 데이터 요약
        if (data) {
            sections.push(
                new Paragraph({
                    text: "3. 데이터 요약",
                    heading: HeadingLevel.HEADING_2,
                })
            );

            sections.push(new Paragraph({ text: "" }));

            if (data.x && data.x.length > 0) {
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "데이터 개수: ",
                                bold: true,
                            }),
                            new TextRun({
                                text: `${data.x.length}개`,
                            }),
                        ],
                    })
                );

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "X 범위: ",
                                bold: true,
                            }),
                            new TextRun({
                                text: `${Math.min(...data.x).toFixed(2)} ~ ${Math.max(...data.x).toFixed(2)}`,
                            }),
                        ],
                    })
                );

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Y 범위: ",
                                bold: true,
                            }),
                            new TextRun({
                                text: `${Math.min(...data.y).toFixed(2)} ~ ${Math.max(...data.y).toFixed(2)}`,
                            }),
                        ],
                    })
                );
            }

            sections.push(new Paragraph({ text: "" }));
        }

        // 결론
        sections.push(
            new Paragraph({
                text: "4. 결론",
                heading: HeadingLevel.HEADING_2,
            })
        );

        sections.push(new Paragraph({ text: "" }));

        const rSquared = analysis.r_squared || 0;
        let conclusion = "";

        if (rSquared > 0.95) {
            conclusion = `회귀 분석 결과, ${analysis.model} 모델이 데이터에 매우 잘 부합합니다 (R² = ${rSquared.toFixed(4)}). 이는 실험 데이터가 이론적 예측과 일치함을 보여줍니다.`;
        } else if (rSquared > 0.85) {
            conclusion = `회귀 분석 결과, ${analysis.model} 모델이 데이터에 잘 부합합니다 (R² = ${rSquared.toFixed(4)}).`;
        } else {
            conclusion = `회귀 분석 결과, ${analysis.model} 모델을 사용하였으나 R² = ${rSquared.toFixed(4)}로 개선의 여지가 있습니다.`;
        }

        sections.push(
            new Paragraph({
                text: conclusion,
            })
        );

        // Word 문서 생성
        const doc = new Document({
            sections: [{
                properties: {},
                children: sections,
            }],
        });

        // Buffer로 변환
        const buffer = await Packer.toBuffer(doc);

        // 파일명 생성
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = template && template !== 'none'
            ? `${template}_${timestamp}.docx`
            : `실험보고서_${timestamp}.docx`;

        // 응답
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buffer);

    } catch (error) {
        console.error('Word generation error:', error);

        return res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to generate Word document',
            type: error.constructor.name
        });
    }
};
