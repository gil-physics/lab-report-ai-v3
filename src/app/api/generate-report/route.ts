import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { GoogleGenerativeAI } from "@google/generative-ai";

// 환경 변수 디버깅
console.log('🔑 API Key loaded:', process.env.GOOGLE_API_KEY ? 'Yes (길이: ' + process.env.GOOGLE_API_KEY.length + ')' : 'No ❌');

// Gemini AI 초기화
const apiKey = process.env.GOOGLE_API_KEY || '';
if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY가 설정되지 않았습니다!');
}
const genAI = new GoogleGenerativeAI(apiKey);

// 템플릿 이름을 한글로 변환
function getTemplateNameKorean(template: string): string {
    const templateMap: { [key: string]: string } = {
        'none': '기본 실험',
        '자유낙하와_포물체운동': '자유낙하와 포물체운동',
        '운동량과_충격량': '운동량과 충격량',
        '원운동과_구심력': '원운동과 구심력',
        '일과_에너지': '일과 에너지',
        '회전_운동': '회전 운동',
        '단순_조화_운동': '단순 조화 운동',
        '물리_진자_비틀림_진자': '물리 진자 / 비틀림 진자',
        '관성모멘트와_각운동량_보존': '관성모멘트와 각운동량 보존',
        '역학적_파동': '역학적 파동',
        '빛의_간섭과_회절': '빛의 간섭과 회절',
        '마이컬슨_간섭계': '마이컬슨 간섭계',
        '밀리컨_기름방울_실험': '밀리컨 기름방울 실험',
    };
    return templateMap[template] || template;
}

// Gemini AI로 보고서 내용 생성
async function generateAIContent(template: string, analysis: any, data: any): Promise<string> {
    // 🔍 디버깅: 함수 내부에서 환경 변수 다시 확인
    console.log('=== generateAIContent 함수 시작 ===');
    console.log('apiKey 변수 값:', apiKey ? `존재 (길이: ${apiKey.length})` : '없음 ❌');
    console.log('process.env.GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? `존재 (길이: ${process.env.GOOGLE_API_KEY.length})` : '없음 ❌');
    console.log('환경 변수 전체:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));

    // API Key가 없으면 기본 텍스트 반환
    if (!apiKey) {
        // 🔍 디버그 정보를 Word 파일에 직접 출력
        const debugInfo = `
🔍 디버그 정보:
- apiKey 변수: ${apiKey || '비어있음 ❌'}
- apiKey 길이: ${apiKey ? apiKey.length : 0}
- process.env.GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY || '비어있음 ❌'}
- process.env.GOOGLE_API_KEY 길이: ${process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.length : 0}
- .env.local 로드됨: ${process.env.NODE_ENV === 'development' ? 'Yes' : 'No'}
- 환경: ${process.env.NODE_ENV}
- GOOGLE로 시작하는 환경 변수: ${Object.keys(process.env).filter(k => k.includes('GOOGLE')).join(', ') || '없음'}
`;

        return `[ERROR-1: API Key 없음] API 분석을 사용할 수 없습니다.

${debugInfo}

기본 분석:
- 회귀 모델: ${analysis.model}
- R² 값: ${(analysis.r_squared || 0).toFixed(4)}
- 데이터 개수: ${data?.x?.length || 0}개

이 결과는 수동으로 해석이 필요합니다.`;
    }


    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const templateName = getTemplateNameKorean(template);
        const rSquared = analysis.r_squared || 0;
        const dataCount = data?.x?.length || 0;

        const prompt = `당신은 대학 물리학 실험 보고서 작성 전문가입니다.

실험 주제: ${templateName}
회귀 분석 결과:
- 최적 모델: ${analysis.model}
- 회귀 수식: ${analysis.equation}
- R² (결정계수): ${rSquared.toFixed(4)}
- Adjusted R²: ${analysis.adj_r_squared?.toFixed(4) || 'N/A'}
- AIC: ${analysis.aic?.toFixed(2) || 'N/A'}
- 데이터 개수: ${dataCount}개

다음 4개 섹션을 작성해주세요. 각 섹션은 명확히 구분하고, 전문적이면서도 대학생이 이해하기 쉽게 작성하세요.

**1. 결과 해석 (150-200자)**
- R² 값의 의미와 모델 적합도 평가
- 실험 데이터의 신뢰성
- 이론적 예측과의 일치도

**2. 오차 원인 분석 (100-150자)**
- 가능한 오차 원인 3가지
- 각 원인이 결과에 미치는 영향
- 실험 환경의 한계

**3. 실험적 의의 (80-120자)**
- 이 실험을 통해 확인한 물리 법칙
- 이론과 실험의 관계
- 실제 응용 가능성

**4. 종합 결론 (100-150자)**
- 핵심 발견 요약
- 실험 목표 달성 여부
- 향후 개선 방향 제안

각 섹션을 명확히 "1. 결과 해석:", "2. 오차 원인 분석:", "3. 실험적 의의:", "4. 종합 결론:" 으로 시작하세요.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini AI error:', error);
        // 에러 발생 시 기본 텍스트 반환
        return `[ERROR-2: API 호출 실패] AI 분석 생성 중 오류가 발생했습니다.
오류 내용: ${error instanceof Error ? error.message : 'Unknown error'}

기본 분석:
1. 결과 해석: R² = ${(analysis.r_squared || 0).toFixed(4)} - ${analysis.model} 모델로 피팅되었습니다.

2. 오차 원인: 측정 오차, 환경 변수, 장비 한계 등이 결과에 영향을 미칠 수 있습니다.

3. 실험적 의의: ${analysis.model} 관계를 실험적으로 확인했습니다.

4. 종합 결론: 회귀 분석을 통해 데이터의 경향성을 파악했으며, 추가적인 해석이 필요합니다.`;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { template, analysis, data } = await request.json();

        // 데이터 검증
        if (!analysis) {
            return NextResponse.json(
                { status: 'error', message: 'Analysis results are required' },
                { status: 400 }
            );
        }

        // AI로 보고서 내용 생성
        console.log('Generating AI content...');
        const aiContent = await generateAIContent(template || 'none', analysis, data);
        console.log('AI content generated successfully');

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
                    new TextRun({ text: "최적 모델: ", bold: true }),
                    new TextRun({ text: analysis.model || "Unknown" }),
                ],
            })
        );

        // 수식
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "회귀 수식: ", bold: true }),
                    new TextRun({ text: analysis.equation || "N/A" }),
                ],
            })
        );

        // R²
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "결정계수 (R²): ", bold: true }),
                    new TextRun({ text: analysis.r_squared != null ? analysis.r_squared.toFixed(4) : "N/A" }),
                ],
            })
        );

        // Adjusted R²
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "조정된 결정계수 (Adj R²): ", bold: true }),
                    new TextRun({ text: analysis.adj_r_squared != null ? analysis.adj_r_squared.toFixed(4) : "N/A" }),
                ],
            })
        );

        // AIC
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "AIC: ", bold: true }),
                    new TextRun({ text: analysis.aic != null ? analysis.aic.toFixed(2) : "N/A" }),
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

            analysis.parameters.forEach((param: number, index: number) => {
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
                            new TextRun({ text: "데이터 개수: ", bold: true }),
                            new TextRun({ text: `${data.x.length}개` }),
                        ],
                    })
                );

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: "X 범위: ", bold: true }),
                            new TextRun({ text: `${Math.min(...data.x).toFixed(2)} ~ ${Math.max(...data.x).toFixed(2)}` }),
                        ],
                    })
                );

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Y 범위: ", bold: true }),
                            new TextRun({ text: `${Math.min(...data.y).toFixed(2)} ~ ${Math.max(...data.y).toFixed(2)}` }),
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

        sections.push(new Paragraph({ text: "" }));
        sections.push(new Paragraph({ text: "" }));

        // AI 생성 분석 섹션
        sections.push(
            new Paragraph({
                text: "5. AI 분석 및 해석",
                heading: HeadingLevel.HEADING_2,
            })
        );

        sections.push(new Paragraph({ text: "" }));

        // AI 콘텐츠를 문단으로 분할하여 추가
        const aiLines = aiContent.split('\n').filter(line => line.trim());
        aiLines.forEach(line => {
            sections.push(
                new Paragraph({
                    text: line,
                })
            );
        });

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
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            },
        });

    } catch (error: any) {
        console.error('Word generation error:', error);

        return NextResponse.json(
            {
                status: 'error',
                message: error.message || 'Failed to generate Word document',
                type: error.constructor.name
            },
            { status: 500 }
        );
    }
}
