# **고밀도 데이터 기반의 과학적 워크플로우 애플리케이션 구축: React, FastAPI, 그리고 Physics-Informed AI의 통합 아키텍처 보고서**

## **1\. 서론: 과학적 데이터 도구의 현대적 재해석**

### **1.1 데이터 집약적 환경과 사용자 경험의 괴리**

현대의 과학 실험 및 엔지니어링 데이터 분석 환경은 그 어느 때보다 방대하고 복잡한 수치 데이터를 다루고 있다. 연구자들은 수천 개의 행과 수십 개의 물리적 변수가 포함된 데이터셋을 일상적으로 처리하며, 이를 통해 유의미한 패턴을 발견하고 물리적 법칙을 검증해야 한다. 그러나 이러한 데이터를 다루는 소프트웨어 인터페이스(Interface)의 발전은 데이터의 복잡성을 따라가지 못하고 있는 실정이다. 특히 최근의 웹 디자인 트렌드는 모바일 친화적인 접근성과 터치 인터페이스를 고려하여 넓은 여백(White space)과 큰 컴포넌트 크기를 지향하고 있다. 이는 일반적인 소비자용 애플리케이션(B2C)에는 적합할지 모르으나, 한 화면에서 최대한 많은 정보를 동시에 파악하고 제어해야 하는 전문 연구자나 엔지니어에게는 심각한 공간 낭비이자 인지적 단절을 초래한다.1 사용자가 "기능은 괜찮은데 UI/UX가 이상하다"고 느끼는 근본적인 원인은 바로 이러한 **정보 밀도(Information Density)** 의 불일치에 있다. 엑셀(Excel)이나 매트랩(MATLAB)과 같은 도구들이 여전히 사랑받는 이유는 투박하지만 높은 정보 밀도를 제공하기 때문이다. 따라서 본 프로젝트의 UI/UX 혁신은 단순한 심미적 개선이 아닌, **'Compact Design'** 철학을 통해 정보의 밀도를 최적화하고 전문가의 작업 효율성을 극대화하는 데 초점을 맞춰야 한다.

### **1.2 Physics-Informed AI의 필요성**

또한, 기존의 데이터 분석 도구들은 데이터의 '물리적 맥락(Physical Context)'을 이해하지 못한다는 한계가 있다. 예를 들어, Column A와 Column B가 각각 '질량(Mass)'과 '가속도(Acceleration)'를 나타낸다는 사실을 시스템이 인지하지 못하기 때문에, 사용자는 매번 수동으로 F \= ma와 같은 수식을 입력하여 '힘(Force)'을 계산해야 한다. 이는 단순 반복 작업일 뿐만 아니라 휴먼 에러(Human Error)의 원인이 되기도 한다. 최근 거대 언어 모델(LLM)의 발전은 이러한 문제를 해결할 새로운 가능성을 제시한다. AI가 데이터의 컬럼명과 단위를 분석하여 물리적 의미를 추론하고, 필요한 파생 변수 계산을 능동적으로 제안하는 **'능동형 보조(Active Assistance)'** 시스템을 구축할 수 있게 된 것이다.3 본 보고서는 이러한 배경을 바탕으로 React+Vite와 FastAPI 스택을 활용하여 고밀도 UI와 AI 물리학 엔진이 결합된 3단계 워크플로우 애플리케이션의 아키텍처 및 구현 가이드를 심층적으로 다룬다.

## ---

**2\. 전략적 UX/UI 디자인: 고밀도(Compact) 인터페이스 철학**

### **2.1 Compact UI의 정의와 인지적 효율성**

'Compact UI'는 단순히 컴포넌트의 크기를 줄이는 것이 아니다. 이는 사용자가 불필요한 스크롤이나 페이지 전환 없이 필요한 정보에 즉각적으로 접근할 수 있도록 시각적 계층 구조를 재설계하는 과정이다. 연구에 따르면, 전문가는 한 번의 시선 이동(Saccade)으로 더 많은 정보를 처리할 수 있는 고밀도 인터페이스에서 더 높은 생산성을 보인다.1 따라서 본 애플리케이션의 디자인 시스템은 **'Screen Real Estate(화면 부동산)'** 의 가치를 최우선으로 고려해야 한다. 불필요한 패딩(Padding)과 마진(Margin)을 제거하고, 시각적 구분을 위해 여백 대신 얇은 경계선(Hairline Border)이나 미세한 배경색 차이(Subtle Background Contrast)를 활용하는 전략이 필요하다.

### **2.2 Shadcn/UI 및 Tailwind CSS 기반의 밀도 최적화**

Shadcn/UI는 재사용 가능한 컴포넌트를 제공하며 Tailwind CSS를 통해 스타일을 완벽하게 제어할 수 있어 고밀도 인터페이스 구현에 최적의 선택지다.5 그러나 기본 설정(Default Theme)은 여유로운 간격을 가지고 있으므로, 이를 엔지니어링 도구에 맞게 튜닝하는 작업이 선행되어야 한다.

#### **2.2.1 타이포그래피와 공간 시스템의 재정의**

일반적인 웹 앱의 본문 폰트 크기가 14px\~16px인 반면, 고밀도 데이터 그리드에서는 12px\~13px이 가독성과 정보량의 균형점으로 작용한다. Tailwind 설정을 통해 이를 체계화해야 한다.

| 속성 (Attribute) | 일반 웹 표준 (Standard) | Compact 엔지니어링 표준 (Proposed) | 설명 및 의도 |
| :---- | :---- | :---- | :---- |
| **기본 폰트 크기** | 16px (text-base) | **13px (text-\[13px\])** | 데이터 가독성을 유지하면서 정보 표시량 20% 증대 |
| **입력 필드 높이** | 40px\~44px (h-10) | **28px\~32px (h-7 \~ h-8)** | 수직 공간 절약, 한 화면에 더 많은 행(Row) 표시 |
| **수평 패딩 (X-Padding)** | 16px (px-4) | **8px\~12px (px-2 \~ px-3)** | 버튼 및 셀 내부의 불필요한 여백 제거 |
| **보더 반경 (Radius)** | 8px (rounded-md \~ lg) | **2px\~4px (rounded-sm)** | 더 날카롭고 정밀한(Precise) 기계적 느낌 전달 |
| **아이콘 크기** | 20px\~24px | **14px\~16px** | 텍스트 라인 높이(Line-height)에 맞춰 아이콘 정렬 |

이러한 설정은 tailwind.config.js의 theme.extend 섹션에서 spacing, fontSize, borderRadius를 오버라이딩하여 시스템 전체에 일관되게 적용된다. 특히 density-compact와 같은 유틸리티 클래스를 정의하여, 특정 컨테이너 내부의 모든 자식 요소가 자동으로 축소된 스타일을 상속받도록 하는 CSS 변수(Variable) 전략이 유효하다.6

### **2.3 시각적 계층 구조와 정보의 위계**

밀도를 높이다 보면 화면이 복잡해 보일 위험(Clutter)이 있다. 이를 방지하기 위해 **'색상(Color)'** 과 **'타이포그래피의 위계(Typography Hierarchy)'** 를 적극 활용해야 한다. 중요한 데이터(예: AI가 제안한 이상치)는 강한 색상(Primary Color)으로 강조하고, 보조 정보(단위, 메타데이터)는 채도를 낮춘 회색조(Muted Foreground)로 처리하여 시각적 노이즈를 줄인다. 테이블의 헤더(Header)는 배경색을 어둡게 하거나 굵은 폰트를 사용하여 데이터 영역과 명확히 구분하며, 격자선(Grid lines)은 매우 연한 색상(예: border-slate-200)을 사용하여 데이터 판독을 방해하지 않도록 한다.7

## ---

**3\. 프론트엔드 아키텍처: React, Vite, 그리고 상태 관리**

### **3.1 기능 중심의 모듈형 아키텍처 (Feature-First Architecture)**

애플리케이션의 복잡도가 증가함에 따라, 단순히 컴포넌트의 유형(Button, Input)별로 폴더를 나누는 것보다 기능(Feature) 단위로 구조화하는 것이 유지보수에 유리하다. 본 프로젝트는 3단계 워크플로우(수집 \-\> 분석 \-\> 리포트)를 핵심 축으로 하므로, 각 단계를 독립적인 모듈로 간주한다.

* features/ingestion: 파일 업로드, 파싱, 단위 추론 UI  
* features/analysis: 데이터 그리드, 차트 시각화, AI 변수 제안 패널  
* features/report: Tiptap 에디터, PDF 내보내기 로직

이러한 구조는 각 기능의 상태(State)와 로직(Logic)을 응집력 있게 관리할 수 있게 해주며, 팀 내 개발자가 특정 기능에 집중할 때 다른 부분의 코드를 건드리지 않도록 격리 효과를 제공한다.

### **3.2 상태 관리 전략: Zustand와 Context API의 조화**

3단계 워크플로우는 단계 간 데이터 공유가 필수적이다. 1단계에서 업로드된 데이터는 2단계에서 분석되고, 3단계 리포트에 삽입된다. 이를 위해 전역 상태 관리가 필요하지만, Redux와 같은 무거운 라이브러리는 보일러플레이트 코드가 많아 비효율적이다. 본 프로젝트에서는 **Zustand**를 채택하여 간결하고 직관적인 전역 상태 관리를 구현한다.

Zustand 스토어는 dataset, computedVariables, reportContent와 같은 핵심 데이터를 보유하며, 각 단계의 컴포넌트는 필요한 데이터만 구독(Subscribe)하여 불필요한 리렌더링을 방지한다. 반면, 특정 컴포넌트 내부의 UI 상태(예: 모달의 열림/닫힘, 탭 선택)는 React의 useState나 Context API를 사용하여 국소적으로 관리함으로써 전역 스토어의 복잡도를 낮춘다.

### **3.3 대용량 데이터 처리와 성능 최적화**

과학 실험 데이터는 수만 행(Row)에 달할 수 있다. 이를 일반적인 HTML 테이블(\<table\>)로 렌더링하면 DOM 노드의 개수가 폭증하여 브라우저가 마비될 수 있다. 이를 해결하기 위해 **'가상화(Virtualization)'** 기술이 필수적이다. **TanStack Table**과 **TanStack Virtual**을 결합하여, 현재 사용자의 화면(Viewport)에 보이는 행만 렌더링하고 나머지는 가상의 공간으로 처리하는 방식을 도입한다.9 이 방식은 데이터의 크기와 상관없이 일정한 프레임 레이트(60fps)를 유지할 수 있게 해준다. 또한, 파일 파싱과 같은 무거운 작업은 메인 스레드(Main Thread)가 아닌 **Web Worker**에서 처리하여 UI의 반응성을 유지해야 한다.

## ---

**4\. 백엔드 아키텍처: FastAPI와 과학적 데이터 처리**

### **4.1 비동기 처리를 통한 고성능 API 구축**

FastAPI는 Python의 asyncio를 기반으로 하여 I/O 바운드 작업(DB 조회, 외부 API 호출)에 탁월한 성능을 발휘한다. AI 모델(OpenAI API 등)과의 통신은 응답 시간이 불규칙하고 길어질 수 있으므로, 비동기 처리가 필수적이다. 사용자가 AI 분석을 요청했을 때, 서버는 즉시 응답을 보류(Blocking)하는 대신 백그라운드 태스크로 작업을 넘기고, WebSocket이나 SSE(Server-Sent Events)를 통해 진행 상황을 클라이언트에 실시간으로 전송하는 패턴을 고려해야 한다.10

### **4.2 데이터 검증과 안정성: Pydantic의 활용**

과학 데이터는 타입(Type)과 형식이 매우 중요하다. 문자열이 들어와야 할 곳에 숫자가 들어오거나, 필수 메타데이터가 누락되면 전체 분석 결과가 오염될 수 있다. FastAPI와 긴밀하게 통합된 **Pydantic**은 런타임에 강력한 데이터 검증을 수행한다.

| 모델 (Model) | 역할 및 검증 항목 | 중요성 |
| :---- | :---- | :---- |
| **RawDataSchema** | 업로드된 CSV/JSON의 구조 검증 (컬럼 존재 여부, 결측치 허용 범위) | 데이터 무결성 보장 |
| **UnitSchema** | 각 컬럼의 물리 단위 문자열 검증 (예: m/s는 유효, m//s는 불가) | 물리 엔진 오류 방지 |
| **FormulaRequest** | AI가 제안한 수식의 안전성 검증 (허용되지 않은 함수 사용 차단) | 보안 취약점(Code Injection) 방지 |

### **4.3 물리 엔진 통합: Pint와 Unyt**

백엔드의 핵심 차별점은 물리 단위를 이해하는 능력이다. Python 생태계의 **Pint** 또는 **Unyt** 라이브러리를 통합하여, 단순한 숫자가 아닌 '물리량(Quantity)'으로 데이터를 처리한다. 예를 들어, 사용자가 10 \[km\]와 500 \[m\]를 더하라는 요청을 보내면, 일반적인 프로그램은 510을 반환하지만, 본 시스템은 내부적으로 단위를 통일하여 10.5 \[km\] 또는 10500 \[m\]라는 정확한 물리적 결과를 도출해야 한다.12 또한, AI가 제안한 수식이 차원적으로 일관성이 있는지(Dimensional Consistency) 검증하는 로직을 이 라이브러리들을 통해 구현한다. 예를 들어, 길이를 시간으로 나누면 속도 차원이 나오는지 확인하여 AI의 환각(Hallucination)을 걸러내는 필터 역할을 수행한다.14

## ---

**5\. 핵심 기능 심층 분석 1: 지능형 데이터 수집 (Smart Ingestion)**

### **5.1 파일 파싱과 메타데이터 추출**

사용자가 파일을 드래그 앤 드롭하는 순간, 시스템은 단순한 업로드를 넘어 데이터의 '프로파일링(Profiling)'을 시작한다. CSV 헤더에 포함된 단위 정보를 정규표현식(Regex)을 통해 추출하는 것이 첫 번째 단계다. 많은 실험 데이터는 Velocity (m/s), Mass \[kg\], Time\_s와 같이 다양한 관습적 표기법을 따른다. 시스템은 이러한 패턴을 인식하여 컬럼명과 단위를 분리하고, 이를 정규화(Normalize)된 형태로 변환한다.

### **5.2 단위 추론(Unit Inference) 알고리즘**

헤더에 단위가 명시되지 않은 경우, 데이터의 값(Value) 분포나 컬럼명을 기반으로 단위를 추측하는 휴리스틱 알고리즘을 적용할 수 있다. 예를 들어, 컬럼명이 temp이고 값이 300 내외라면 Kelvin일 가능성이 높고, 20\~30 사이라면 Celsius일 가능성이 높다. 물론 이러한 추론은 확률적이므로, UI 상에서 사용자에게 "이 단위가 맞습니까?"라고 확인하는 절차(Human-in-the-loop)를 반드시 거쳐야 한다. React 클라이언트는 백엔드에서 추론된 단위 목록을 받아 드롭다운 메뉴 형태로 보여주며, 사용자가 이를 수정하거나 확정할 수 있도록 한다.15

## ---

**6\. 핵심 기능 심층 분석 2: AI 기반 물리 변수 제안 (Physics Co-pilot)**

### **6.1 LLM과 심볼릭 AI의 하이브리드 접근**

순수하게 LLM(Large Language Model)에만 의존하여 물리 계산을 수행하는 것은 위험하다. LLM은 그럴듯해 보이는 틀린 수식(Hallucination)을 생성할 수 있기 때문이다. 따라서 본 시스템은 **'Semantic Understanding(의미 이해)'** 은 LLM에게 맡기고, **'Mathematical Verification(수학적 검증)'** 은 SymPy나 Pint와 같은 심볼릭 AI 라이브러리에 맡기는 하이브리드 방식을 채택한다.17

1. **Semantic Phase:** LLM이 컬럼 이름(flow\_rate, pipe\_diameter)을 보고 유체 역학(Fluid Dynamics) 문맥임을 파악한 후, 베르누이 방정식 등 관련 후보군을 탐색한다.  
2. **Validation Phase:** LLM이 제안한 수식(예: flow\_rate / area)을 Pint로 차원 분석하여 결과 단위가 Velocity \[m/s\]가 맞는지 검증한다. 검증을 통과한 수식만이 사용자에게 제안된다.

### **6.2 프롬프트 엔지니어링 가이드 (Prompt Engineering)**

AI가 정확하고 유용한 제안을 하도록 유도하기 위해서는 맥락(Context)을 충분히 제공하는 프롬프트 설계가 필수적이다. 단순히 "계산해줘"가 아닌, 데이터의 도메인과 제약 조건을 명시해야 한다.

#### **\[시스템 프롬프트 예시\]**

당신은 정밀 물리학 및 엔지니어링 데이터 분석 전문가입니다.

사용자가 제공하는 데이터셋의 메타데이터(컬럼명, 단위, 데이터 샘플)를 분석하여,

물리적으로 의미 있는 파생 변수(Derived Variables)를 계산할 수 있는 공식을 제안하십시오.

\[제약 사항\]

1. 제안하는 수식은 반드시 차원적으로 일관성(Dimensionally Consistent)이 있어야 합니다.  
2. 널리 알려진 물리 법칙(뉴턴 역학, 열역학, 전자기학 등)에 기반해야 합니다.  
3. 파이썬 pandas 문법으로 실행 가능한 코드를 제공해야 합니다.  
4. 결과는 JSON 형식으로 반환하십시오.

\[출력 형식\]

{

"suggestions": \[

{

"name": "Kinetic Energy",

"formula": "0.5 \* mass \* velocity \*\* 2",

"unit": "J",

"reasoning": "질량과 속도 변수가 존재하므로 운동 에너지를 계산할 수 있습니다."

}

\]

}

이러한 구조화된 프롬프트는 AI의 응답을 파싱하기 쉬운 형태로 규격화하여 시스템 통합을 용이하게 한다.

### **6.3 제안 UI 패턴: 비침해적(Non-intrusive) 인터페이스**

AI의 제안은 사용자의 주 작업을 방해해서는 안 된다. 팝업창(Modal)을 띄우는 대신, 데이터 그리드의 상단이나 우측 패널에 **'Suggestion Chip'** 또는 **'Insight Card'** 형태로 조용히 나타나야 한다.19 사용자가 칩에 마우스를 올리면(Hover), 해당 계산이 적용되었을 때 데이터 테이블에 추가될 컬럼을 미리보기(Ghost Column)로 보여주어 사용자가 결과를 예측할 수 있게 한다. 사용자가 '수락(Approve)' 버튼을 누르면 그제서야 실제 데이터셋에 반영된다. 이는 AI를 도구로서 통제권을 사용자에게 남겨두는 중요한 UX 원칙이다.

## ---

**7\. 핵심 기능 심층 분석 3: 인터랙티브 리포팅 및 내보내기**

### **7.1 Tiptap 기반의 위지위그(WYSIWYG) 에디터 구현**

최종 리포트는 단순한 텍스트 나열이 아니다. 1단계와 2단계에서 생성된 차트와 데이터 테이블이 본문에 자연스럽게 녹아들어야 한다. **Tiptap** 에디터는 Headless 특성 덕분에 React 컴포넌트를 에디터의 노드(Node)로 렌더링할 수 있는 강력한 기능을 제공한다.20 이를 통해 사용자는 에디터 내에서 차트의 축을 변경하거나 줌인(Zoom-in)하는 등 상호작용할 수 있다. 이는 정적인 이미지 캡처 방식과는 차원이 다른 경험을 제공한다.

### **7.2 리액트 컴포넌트의 문서 내재화 (Node View)**

Tiptap의 NodeView를 확장하여 ChartBlock 컴포넌트를 생성한다. 사용자가 "분석 결과 차트 삽입" 버튼을 누르면, 현재 분석 단계의 차트 설정(Configuration)과 데이터 참조(Reference)를 담은 블록이 에디터에 삽입된다.

TypeScript

// ChartBlock.tsx (개념적 코드)  
\<NodeViewWrapper className="chart-block"\>  
  \<div className="chart-controls"\>...\</div\> // 차트 옵션 제어  
  \<Recharts data={node.attrs.data}... /\> // 실제 차트 렌더링  
\</NodeViewWrapper\>

이 방식은 데이터가 변경되면 리포트 내의 차트도 자동으로 업데이트되는 'Live Document' 개념을 실현할 수 있게 해준다.20

### **7.3 고품질 PDF 생성 전략**

웹 화면을 PDF로 변환하는 것은 까다로운 작업이다. 브라우저의 기본 인쇄 기능은 레이아웃을 깨뜨리기 쉽다. 본 프로젝트에서는 **Puppeteer**를 활용한 서버 사이드 렌더링(SSR) 방식을 권장한다. 사용자가 "PDF 내보내기"를 요청하면, 클라이언트는 현재 리포트의 상태(JSON Content)를 백엔드로 전송한다. 백엔드는 Headless Chrome을 구동하여 해당 리포트를 렌더링하고, 고해상도 PDF로 인쇄하여 반환한다.21 이 방식은 벡터 그래픽(SVG) 차트의 품질을 손상 없이 유지할 수 있으며, 페이지 넘김(Pagination) 처리를 정교하게 제어할 수 있다.

## ---

**8\. 구현 상세 및 베스트 프랙티스**

### **8.1 보안 고려사항: 동적 코드 실행 방지**

AI가 생성한 파이썬 코드를 서버에서 실행하는 것은 보안상 매우 위험하다(rm \-rf /와 같은 명령어가 포함될 수 있음). 따라서 eval() 대신 제한된 범위 내에서만 연산을 수행하는 **Sandboxed Environment**가 필요하다. Python의 numexpr이나 pandas.eval 엔진은 파이썬의 전체 기능이 아닌 수학 연산만을 허용하므로 상대적으로 안전하다. 또한, 도커 컨테이너(Docker Container) 수준에서 실행 환경을 격리하고, 네트워크 접근을 차단하여 만약의 사태에 대비해야 한다.

### **8.2 프론트엔드 성능 최적화**

고밀도 데이터 테이블과 복잡한 차트는 렌더링 성능에 부하를 준다. React의 memo를 적극 활용하여 불필요한 리렌더링을 막고, 차트 데이터는 원본 전체를 그리는 대신 픽셀 밀도에 맞춰 **다운샘플링(Downsampling)** (예: LTTB 알고리즘)하여 시각화해야 한다. 이는 시각적 정확도를 유지하면서도 렌더링 성능을 수십 배 향상시킬 수 있다.

### **8.3 에러 처리 및 사용자 피드백**

AI 서비스는 언제든 실패할 수 있다(API 타임아웃, 토큰 제한 등). 따라서 UI는 낙관적 업데이트(Optimistic UI)보다는 명확한 로딩 인디케이터와 에러 메시지를 제공해야 한다. AI 분석이 실패했을 때 전체 앱이 멈추는 것이 아니라, 수동 분석 모드로 자연스럽게 전환될 수 있도록(Graceful Degradation) 설계해야 한다.

## ---

**9\. 결론 및 향후 전망**

본 보고서를 통해 제안된 시스템은 단순한 데이터 뷰어를 넘어, 엔지니어와 과학자에게 강력한 통찰력을 제공하는 지능형 파트너(Intelligent Partner)로 기능한다. **Compact UI**는 전문가의 작업 흐름을 끊김 없이 지원하며, **Physics-Informed AI**는 데이터 분석의 진입 장벽을 낮추고 오류를 줄여준다.

향후 이 시스템은 **WebAssembly (Pyodide)** 기술을 도입하여 Python 물리 엔진을 브라우저 클라이언트 내부로 옮김으로써 서버 비용을 절감하고 오프라인 동작을 지원하는 방향으로 발전할 수 있다. 또한, AI 에이전트가 단순한 변수 제안을 넘어, 실험 데이터의 이상치(Anomaly)를 감지하고, 결론(Conclusion) 초안까지 작성해주는 완전 자동화된 연구 보조 도구(Automated Research Assistant)로 진화할 잠재력을 가지고 있다. 이 가이드는 그러한 미래 지향적 도구를 구축하기 위한 견고한 첫걸음이 될 것이다.

### ---

**부록: 기술 스택 비교 및 선정 근거**

| 구분 | 선정 기술 (Selected) | 고려 대안 (Alternative) | 선정 이유 |
| :---- | :---- | :---- | :---- |
| **Frontend** | **React \+ Vite** | Next.js | SPA 형태의 대시보드 앱에는 Vite의 빌드 속도와 가벼움이 더 유리함. SSR 불필요. |
| **UI Lib** | **Shadcn/UI \+ Tailwind** | Material UI (MUI) | MUI는 기본 스타일이 무겁고 커스터마이징이 어려움. Shadcn은 완전한 제어권 제공. |
| **Backend** | **FastAPI (Python)** | Node.js (Express) | 물리 연산 및 데이터 처리 라이브러리(Pandas, NumPy) 생태계 활용 필수. |
| **State** | **Zustand** | Redux Toolkit | Redux의 복잡한 보일러플레이트 대비 Zustand의 간결함이 빠른 개발에 적합. |
| **Editor** | **Tiptap** | Quill / Draft.js | React 컴포넌트(차트 등)를 에디터 내부에 렌더링하는 기능(NodeView)이 가장 강력함. |
| **AI Check** | **Pint / Unyt** | Astropy Units | 범용 물리 단위 처리에 Pint가 더 가볍고 유연하며 Pandas 통합이 용이함. |

(이상 보고서 전체 개요 및 핵심 내용)

#### **참고 자료**

1. React Templates \- Dashboard \- shadcn.io, 1월 23, 2026에 액세스, [https://www.shadcn.io/template/category/dashboard](https://www.shadcn.io/template/category/dashboard)  
2. Table Density Compact React Icon SVG \- shadcn.io, 1월 23, 2026에 액세스, [https://www.shadcn.io/icon/oui-table-density-compact](https://www.shadcn.io/icon/oui-table-density-compact)  
3. 14 Key AI Patterns for Designers Building Smarter AI Interfaces \- Koru UX, 1월 23, 2026에 액세스, [https://www.koruux.com/ai-patterns-for-ui-design/](https://www.koruux.com/ai-patterns-for-ui-design/)  
4. Using AI for Data Analysis: The Ultimate Guide (2026) \- Luzmo, 1월 23, 2026에 액세스, [https://www.luzmo.com/blog/ai-data-analysis](https://www.luzmo.com/blog/ai-data-analysis)  
5. Theming — Docs | shadcndesign, 1월 23, 2026에 액세스, [https://www.shadcndesign.com/docs/theming](https://www.shadcndesign.com/docs/theming)  
6. Theming \- shadcn/ui, 1월 23, 2026에 액세스, [https://ui.shadcn.com/docs/theming](https://ui.shadcn.com/docs/theming)  
7. Table/Grid UI Pattern for Applications \- commadot.com, 1월 23, 2026에 액세스, [https://commadot.com/table-grid-ui-pattern-for-applications/](https://commadot.com/table-grid-ui-pattern-for-applications/)  
8. Tailwind CSS Table Examples, 1월 23, 2026에 액세스, [https://www.material-tailwind.com/docs/html/table](https://www.material-tailwind.com/docs/html/table)  
9. Optimizing Performance \- React, 1월 23, 2026에 액세스, [https://legacy.reactjs.org/docs/optimizing-performance.html](https://legacy.reactjs.org/docs/optimizing-performance.html)  
10. FastAPI AI Development Tools: Developer Guide for 2025 \- Augment Code, 1월 23, 2026에 액세스, [https://www.augmentcode.com/tools/fastapi-ai-development-tools-developer-guide-for-2025](https://www.augmentcode.com/tools/fastapi-ai-development-tools-developer-guide-for-2025)  
11. Building Production-Ready AI Backends with FastAPI \- DEV Community, 1월 23, 2026에 액세스, [https://dev.to/hamluk/building-production-ready-ai-backends-with-fastapi-4352](https://dev.to/hamluk/building-production-ready-ai-backends-with-fastapi-4352)  
12. unyt: Handle, manipulate, and convert data with units in Python | mjt \- Matthew Turk, 1월 23, 2026에 액세스, [https://matthewturk.github.io/publication/goldbaum-2018-ws/](https://matthewturk.github.io/publication/goldbaum-2018-ws/)  
13. unyt: Handle, manipulate, and convert data with units in Python \- arXiv, 1월 23, 2026에 액세스, [https://arxiv.org/pdf/1806.02417](https://arxiv.org/pdf/1806.02417)  
14. View of impunity: Enforcing Physical Unit Consistency at Definition Time in Python, 1월 23, 2026에 액세스, [https://journals.open.tudelft.nl/joas/article/view/7071/5626](https://journals.open.tudelft.nl/joas/article/view/7071/5626)  
15. How can I manage units in pandas data? \- Stack Overflow, 1월 23, 2026에 액세스, [https://stackoverflow.com/questions/39419178/how-can-i-manage-units-in-pandas-data](https://stackoverflow.com/questions/39419178/how-can-i-manage-units-in-pandas-data)  
16. Automatic detection of column unit and unit conversion \- Stack Overflow, 1월 23, 2026에 액세스, [https://stackoverflow.com/questions/49696794/automatic-detection-of-column-unit-and-unit-conversion](https://stackoverflow.com/questions/49696794/automatic-detection-of-column-unit-and-unit-conversion)  
17. Discovering equations from data: symbolic regression in dynamical systems \- arXiv, 1월 23, 2026에 액세스, [https://arxiv.org/html/2508.20257v1](https://arxiv.org/html/2508.20257v1)  
18. AI Feynman: A physics-inspired method for symbolic regression \- PMC \- PubMed Central, 1월 23, 2026에 액세스, [https://pmc.ncbi.nlm.nih.gov/articles/PMC7159912/](https://pmc.ncbi.nlm.nih.gov/articles/PMC7159912/)  
19. React AI Suggestion \- shadcn.io, 1월 23, 2026에 액세스, [https://www.shadcn.io/ai/suggestion](https://www.shadcn.io/ai/suggestion)  
20. React node views | Tiptap Editor Docs, 1월 23, 2026에 액세스, [https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react)  
21. Generating pdf reports with charts using React and Puppeteer \- DEV Community, 1월 23, 2026에 액세스, [https://dev.to/carlbarrdahl/generating-pdf-reports-with-charts-using-react-and-puppeteer-4245](https://dev.to/carlbarrdahl/generating-pdf-reports-with-charts-using-react-and-puppeteer-4245)