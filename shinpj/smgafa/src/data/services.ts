export interface ServiceCategory {
  id: string;
  title: string;
  items: ServiceItem[];
}

export interface ServiceItem {
  title: string;
  description: string;
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: "crisis-system",
    title: "위기관리체계구축",
    items: [
      {
        title: "사각지대노인보호발굴체계구축",
        description: "민/관 협치체계구축, 서비스 수행기관 연대협력 체계 구축",
      },
      {
        title: "사례관리",
        description: "사례발굴(의뢰, 아웃리치 등), 초기상담, 사정 및 계획, 개입, 점검 및 모니터링",
      },
      {
        title: "정보통신기반 일상생활 안전지원",
        description: "ICT기반의 일상생활 관리 및 연계, 야간 안전확인을 통한 위기관리 및 연계 등",
      },
      {
        title: "노인상담 및 정보제공",
        description: "대상자 건강 및 생활교육, 사회보험, 공공부조, 사회복지서비스 등에 대한 종합 안내, 노인 일상생활 관련 전문 상담 등, 통합지원체계 구축",
      },
    ],
  },
  {
    id: "needs-based",
    title: "욕구기반위기관리서비스",
    items: [
      {
        title: "경제적 위기관리",
        description: "혹서기/혹한기지원, 주거환경개선사업, 자원연계지원(후원/결연), 자원관리",
      },
      {
        title: "신체적위기관리",
        description: "경도인지장애 관리 및 연계, 노인성 질환 관리 및 연계 등",
      },
      {
        title: "정신적위기관리",
        description: "알코올의존, 우울 및 자살, 학대 등의 정신적 심리적 위기관련 관리능력 향상 및 관련기관 연계 등",
      },
      {
        title: "사회적위기관리",
        description: "대인관계증진, 소규모 지역 밀착형 문화생활 지원, 지역자원 활용 사회참여 기회 확대 등",
      },
    ],
  },
  {
    id: "emergency",
    title: "위기상황 관리 및 긴급지원",
    items: [
      {
        title: "권리옹호",
        description: "노인위기상황 협력 대응체계 구축, 노인인식개선, 돌봄가족지원, 기타지역사회노인을 위한 사업",
      },
      {
        title: "긴급지원",
        description: "자연재해 및 기타 응급상황에 대한 보호",
      },
    ],
  },
  {
    id: "specialized",
    title: "경기도특화서비스",
    items: [
      {
        title: "특화서비스",
        description: "돌봄간병지원, 체육운동, 사회관계형성프로그램, 맞춤형프로그램, AI 기반 돌봄 지원",
      },
    ],
  },
];

export const applicationSteps = [
  "의뢰/신청상담",
  "(가정방문) 서비스 지원여부 판정",
  "판정결과보고",
  "의정부시 승인",
  "서비스제공 안내",
  "서비스 제공 및 대상자 관리",
];

export const requiredDocuments = [
  "주민등록등본",
  "수급자증명서",
  "차상위계층확인서",
  "건강보험료납부확인서 (저소득자)",
];
