import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconChevronRight, IconX } from '@tabler/icons-react';
import type { IsoflowProps } from 'isenax';

type Locale = NonNullable<IsoflowProps['locale']>;

interface Props {
  locale: Locale;
  onClose: () => void;
}

interface ChangelogGroup {
  version: string;
  date: string;
  // Each item is [boldedKeyword, restOfSentence] so the key part reads at a glance.
  items: [string, string][];
}

// Changelog entries aren't run through the full 15-language i18n pipeline (they
// change too often for that to be sustainable) — Korean is the primary language
// this app is developed/tested in, English is the fallback for everyone else.
//
// Grouped by version, newest first. When adding new entries, add a new group
// rather than appending to an existing one's `items`.
const CHANGELOG_KO: ChangelogGroup[] = [
  {
    version: 'v1.8.0',
    date: '2026-08-24',
    items: [
      ['노드 우클릭(모바일은 길게 누르기) → "하위 뷰 만들기"', '로 그 아이템만의 상세 다이어그램(하위 뷰)으로 드릴다운 가능 — 진입점 아이콘은 고정되어 삭제할 수 없고, 레이어 패널 헤더가 상위 뷰로 돌아가는 버튼을 겸함'],
      ['레이어 패널의 각 노드 행', '에도 하위 뷰 생성/열기 아이콘 버튼 추가 — 우클릭이 어려운 환경에서도 바로 접근 가능'],
      ['빈 채로 나간 하위 뷰', '는 자동으로 정리되어 원래 없던 것처럼 되돌아가고, 우클릭 메뉴에 다시 "만들기"로 표시됨'],
      ['노드를 선택하면', ' 다른 노드들이 흐려져서(dim) 선택된 노드가 더 잘 구분됨'],
      ['연결선을 선택하면', ' 양 끝 점뿐 아니라 선 자체에도 캔버스에 하이라이트가 표시됨'],
      ['레이어 패널에서 이미 선택된 항목', '을 다시 클릭하면 선택이 해제됨'],
      ['모바일/좁은 화면에서 상단 툴바', '가 저장된 위치 설정과 무관하게 자동으로 가로 배치로 전환됨'],
      ['설정 화면', '도 모바일에서 전체화면으로 열리고, 좌측 그룹 목록 대신 가로로 스크롤되는 아이콘 스트립 내비게이션으로 전환됨']
    ]
  },
  {
    version: 'v1.7.0',
    date: '2026-08-20',
    items: [
      ['레이어 패널', '에 검색창과 타입 필터 칩(전체/노드/연결/영역/텍스트)을 추가해 항목이 많아져도 빠르게 찾을 수 있음'],
      ['레이어 패널', '이 영역(구역) 안에 속한 노드를 그 영역 아래에 중첩해서 보여주도록 그룹핑을 개선하고, 항목별 표시/잠금 토글과 목록 열고 닫힐 때의 슬라이드 애니메이션 추가'],
      ['레이어 패널에서 항목을 잠그면', ' 캔버스에서 직접 클릭해도 선택되지 않도록 잠금이 실제로 적용됨 (기존에는 목록에서만 잠기고 캔버스 클릭 선택은 막지 못했음)'],
      ['겹쳐 있는 커넥터', '를 클릭·드래그할 때 항상 맨 처음 것만 잡히던 문제, 드래그를 원래 자리로 되돌렸을 때 유령 웨이포인트가 남던 문제 수정'],
      ['웨이포인트가 있는 커넥터 쌍', '의 그룹핑 기준을 앵커 개수 대신 시작·끝 앵커로 바꿔, 겹쳐 보이던 문제 수정'],
      ['레이어 패널', '을 화면 가장자리에 완전히 붙여 도킹하고, 상단바 위치를 위/왼쪽 중에서 고를 수 있는 설정 추가'],
      ['노드 편집 패널의 요약 카드', '를 리디자인 — 큰 아이콘, "● 선택됨" 배지, 구역/연결 수/타입 칩, "아이콘 변경" 버튼으로 구성. 라벨 표시 모드(항상/호버 시/숨김)와 연결 요약(입력/출력) 섹션 신규 추가'],
      ['연결 요약의 입력/출력 목록', '에서 항목을 클릭하면 해당 연결 노드로 캔버스가 이동(센터링)하고 편집 패널도 그 노드로 바로 전환됨'],
      ['라벨 표시 토글 버튼', '이 선택 상태에서도 잘 안 보이던 문제 수정 — 선택된 항목이 진한 배경의 필(pill) 모양으로 뚜렷하게 표시됨'],
      ['레이어 패널의 검색/필터/구역 요약 관련 문구', '가 13개 언어 중 영어로만 표시되던 문제 수정 — 전체 언어 번역 완료'],
      ['설정 화면', '을 검색 가능한(⌘K) 사이드바 방식의 2단 구성으로 개편 — 단축키/이동·확대, 화면 표시, 아이콘 팩, 확장 그룹으로 재편되며 기존 탭 방식을 대체. 취소 시 다이얼로그를 여는 동안 바꾼 내용이 원래대로 되돌아가고, 저장을 눌러야 실제로 반영되며, 각 섹션마다 "기본값으로 재설정" 버튼 추가'],
      ['Skills 패널', ' 제거 — 자동 배치 기능과 그 토글이 설정 화면에서 사라짐'],
      ['MCP 패널', '에 연결된 AI 에이전트가 호출할 수 있는 "사용 가능한 도구" 목록(다이어그램 조회/생성/수정/부분수정/삭제) 추가 — 켜기 토글 아래에 참고용으로 표시'],
      ['커넥터 연결 방식 선택', ' — 클릭형/드래그형을 고르던 라디오 목록이 나란히 놓인 그림 카드 방식으로 바뀌고, 연결선 흐름 효과 미리보기 애니메이션 추가'],
      ['상단바 위치 선택', '도 같은 그림 카드 방식으로 변경'],
      ['확대/축소 설정 화면', ' — "커서 위치로 확대"와 "트랙패드 모드" 항목에 단순 스위치 대신 전/후 비교 그림과 제스처 그림 추가'],
      ['이동(Pan) 설정 화면', ' — 클릭/길게 누르기/휠 클릭 등 이동 트리거 토글들을 촘촘한 격자 형태로 재배치하고, 키보드 이동 속도 슬라이더 양 끝에 "느림"/"빠름" 라벨 추가'],
      ['아이콘 팩 목록', ' — AWS·GCP·Azure·Kubernetes 팩이 이니셜 배지 대신 실제 브랜드 로고로 표시되고, 기본 제공 Isoflow 팩도 고유 아이콘 배지 적용'],
      ['노드 그림자·강조색 기능', ' 제거 — 지난 업데이트에서 노드 편집 패널에 추가됐던 그림자 토글과 강조색 선택기, 그리고 그로 인한 노드 외형 변화를 되돌림'],
      ['툴바·단축키 목록 순서', ' — 이동(Pan) 도구가 선택 도구보다 앞에 오도록 순서 변경']
    ]
  },
  {
    version: 'v1.6.1',
    date: '2026-08-14',
    items: [
      ['Docker로 직접 호스팅하는 경우', ' MCP 서버가 빌드되지 않거나(빌드 실패) 빌드되어도 접속이 안 되던 문제 수정 — 이제 Docker 배포에서도 설정 화면에 뜨는 연결 URL로 정상 접속됨']
    ]
  },
  {
    version: 'v1.6.0',
    date: '2026-08-14',
    items: [
      ['MCP 서버 지원', ' 추가 — 설정 화면에서 켜고 끄면 외부 AI 에이전트가 연결 정보(URL·토큰)로 접속해 다이어그램을 직접 읽고 만들고 수정할 수 있음'],
      ['MCP로 다이어그램을 수정하는 동안', ' 그 다이어그램이 열려 있는 탭에 새로고침 없이 실시간으로 반영되고, 화면 하단에 "MCP로 작성 중..." 표시가 나타남'],
      ['Skills 패널', ' 추가 (설정 화면) — AI 다이어그램 자동화 기능(자동 배치 등)을 켜고 실행'],
      ['영역(사각형) 위에 겹친 텍스트', '를 클릭하면 텍스트 대신 영역이 선택되던 문제 수정 — 특히 소수점 좌표로 미세 배치한 구역 이름표에서 자주 발생하던 문제'],
      ['연결선이 노드 아이콘 박스 안쪽까지 그려져', ' 선이 아이콘 뒤로 비쳐 보이던 문제 수정 — 이제 아이콘 가장자리에서 선이 멈춤'],
      ['MCP가 켜진 상태에서 히스토리 패널을 여는 등', ' 화면이 다시 그려질 때 "Maximum update depth exceeded" 오류로 앱이 멈추던 문제 수정']
    ]
  },
  {
    version: 'v1.5.0',
    date: '2026-08-11',
    items: [
      ['Flowvia → Isenax', ' 리브랜딩 — 앱 이름, 로고, 배너 이미지 교체'],
      ['레이어 패널', ' 추가 — 캔버스의 노드/연결선/영역/텍스트를 오른쪽 목록에서 한눈에 보고 선택 가능, 항목을 고르면 같은 패널의 "편집" 탭에서 바로 수정 (기존처럼 별도 편집 창이 캔버스 위에 뜨지 않음)'],
      ['압축 JSON 내보내기 / 이미지 내보내기 / 설정 / 레이어', '를 햄버거 메뉴에서 꺼내 상단 툴바 아이콘으로 분리'],
      ['모바일 화면', ' 대응 — 레이어 패널이 아래에서 올라오는 시트로 바뀌고(캔버스 우측 하단 버튼으로 열기), 좁은 화면에서 넘치던 상단 툴바 아이콘들은 햄버거 메뉴 안으로 이동해 툴바가 한 줄에 유지됨'],
      ['햄버거 메뉴', ' 항목을 숨겼을 때 구분선이 겹치거나 빈 여백이 남던 문제 수정, "캔버스 지우기"를 맨 위로 이동'],
      ['상단 툴바의 모든 아이콘', '에 마우스를 올리면 아래쪽에 툴팁 표시 (스크린리더용 이름도 함께 추가)'],
      ['툴팁', ' 모양·표시 속도를 전체 통일하고, 뜨기까지 걸리는 시간을 0.4초 → 0.15초로 단축'],
      ['다이어그램 잠금', ' 상태에서도 햄버거 메뉴/툴바/확대·축소 컨트롤이 그대로 보이도록 수정 (공유 링크로 여는 읽기 전용 모드와 구분)'],
      ['불러오기 드롭다운', '을 열면 툴바와 메뉴가 통째로 사라지던 문제 수정'],
      ['언어 선택 메뉴', '가 버튼을 다시 눌러도 닫히지 않던 문제 수정']
    ]
  },
  {
    version: 'v1.4.0',
    date: '2026-08-04',
    items: [
      ['연결선 목록', '의 접힌 줄에도 두께·레이블 개수가 칩으로 표시됨'],
      ['겹침 방지가 섞인 연결선 그룹', '에서 중간 연결선이 제외된 연결선과 겹치던 문제 수정'],
      ['연결선 두께 슬라이더', ' 최소값을 3으로 낮춰 기본 두께에서 슬라이더가 왼쪽 끝에 붙어 보이던 문제 수정, 노드 설정의 레이블 높이/아이콘 크기에도 현재 값 표시'],
      ['노드 편집 패널', ' 재설계 — 기본 정보/외형 섹션으로 구분, 아이콘 변경을 카드로 정리, 슬라이더 옆에 숫자 입력(스테퍼)을 추가해 정확한 값 입력 가능, 삭제/복제 버튼은 하단 고정 바로 이동'],
      ['연결선 흐름 애니메이션', '에 속도 조절 슬라이더 추가, 여러 연결선의 흐름 점이 서로 어긋나지 않고 맞춰서 움직이도록 수정'],
      ['연결선 목록에서 순서 바꾸기(드래그)', ' 연결선이 2개일 때 한 번 옮기면 멈추던 버그 수정 — 드래그 중에는 삽입 위치만 표시하고, 놓을 때 실제로 순서 변경'],
      ['연결선 목록', '에 시작 → 끝 노드 이름 표시 (이름 없는 연결선끼리도 구분 가능)'],
      ['연결선 순서 변경', '이 캔버스에 반영되는 방향이 반대였던 문제 수정 — 목록 맨 위로 옮기면 캔버스에서도 맨 앞에 오도록 수정'],
      ['영역(사각형) 몸체와 모서리', '에 마우스를 올리면 이동/크기조절 커서로 바뀌어 조작 가능함을 알 수 있도록 개선'],
      ['평면(플랫) 보기 모드', '에서 영역의 크기조절 손잡이가 실제 모서리를 벗어나 있던 문제 수정'],
      ['다이어그램 잠금(읽기 전용) 상태', '에서도 노드/연결선/영역을 클릭해 내용을 확인할 수 있도록 개선 (수정은 계속 차단됨)']
    ]
  },
  {
    version: 'v1.3.1',
    date: '2026-08-02',
    items: [
      ['스위치(토글) 켰을 때', ' 흰색 손잡이가 배경과 같은 색이 되어 안 보이던 문제 수정'],
      ['연결선 편집 패널의 스위치 2개(화살표 표시/겹침 방지)', ' 간격 없이 붙어 보이던 레이아웃 버그와, 라벨이 스위치에 딱 붙어 보이던 문제 수정']
    ]
  },
  {
    version: 'v1.3.0',
    date: '2026-08-02',
    items: [
      ['전체 디자인', ' 개편 — 그림자 대신 얇은 테두리 사용, 버튼/슬라이더를 더 플랫한 스타일로, 스위치를 vuesax.com 스타일로 변경'],
      ['빈 캔버스를 꾹 누르고 있으면', ' 0.3초 후 화면 이동(팬) 모드로 자동 전환 (기존처럼 클릭 즉시 이동하던 방식은 설정에서 다시 켤 수 있음)'],
      ['햄버거 메뉴', '에서 중복된 실행취소/다시실행 제거, "캔버스 지우기"는 위험한 동작이라 메뉴 맨 아래로 분리하고 빨간색으로 표시'],
      ['연결선 그룹', '의 간격을 두께에 맞게 넓히고, 화살표 크기도 연결선 두께에 비례하도록 수정'],
      ['다이어그램 잠금 버튼', '이 처음 저장하기 전에는 안 보이던 문제 수정'],
      ['남아있던 일부 아이콘', ' 크기를 20px로 통일 (도구모음, 확대/축소, 다이얼로그 닫기 버튼 등)']
    ]
  },
  {
    version: 'v1.2.1',
    date: '2026-08-02',
    items: [
      ['오프라인 지원(PWA)', '이 매 빌드마다 조용히 깨져있던 문제 수정 — 캐시 파일 경로가 실제 빌드 결과물과 달라 설치 단계에서 실패하고 있었음']
    ]
  },
  {
    version: 'v1.2.0',
    date: '2026-08-01',
    items: [
      ['노드/영역/텍스트 우클릭 메뉴 순서', ' 변경 — 노드는 연결선 추가가 최상단(구분선으로 구분), 이어서 수정 → 복사 → 복제 → 삭제 순'],
      ['연결선을 빈 타일에 연결한 뒤 그 자리에 노드 추가', '하면 연결선이 자동으로 그 노드에 연결됨'],
      ['연결선이 겹칠 때', ' 화살표가 한 곳에 뭉쳐 보이거나, 반대 방향으로 그린 연결선끼리 서로 겹치던 문제 수정'],
      ['연결선 목록', '에 겹침 방지 켜고 끄기 스위치, 드래그로 순서(간격 위치) 변경 기능 추가'],
      ['연결선', '에 방향 전환 버튼 추가'],
      ['연결선 선 스타일', '을 드롭다운 대신 실선/파선/점선 버튼으로 변경'],
      ['연결선 편집 패널', ' 스크롤해도 제목/닫기 버튼이 고정되도록 수정, 이름/설명 입력란 추가, 항목 순서 정리 (이름 → 설명 → 색상 → 두께 → 선 스타일 → 옵션 → 레이블)'],
      ['연결선 우클릭 메뉴', ' 구분선 위치 조정 및 "여기 연결선 목록 보기" 문구 정리'],
      ['저장/불러오기/도구 모음 아이콘', ' 새 디자인으로 교체']
    ]
  },
  {
    version: 'v1.1.1',
    date: '2026-07-31',
    items: [
      ['Docker 이미지 빌드', ' 캐시 저장 단계에서 실패 오류가 뜨던 문제 수정 (실제 빌드·배포 자체에는 영향 없었음)']
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-07-31',
    items: [
      ['노드 설명 표시 방식', ' 개선 — 기본적으로 접혀 있고 title 옆 화살표를 눌러야 펼쳐짐'],
      ['Undo/Redo 버튼', ' 비활성화 표시 오류 수정 (할 일이 없을 때도 활성화된 것처럼 보이던 문제)'],
      ['노드/커넥터/영역 속성 패널', ' 다국어 번역 적용 (레이블 높이, 색상, 커넥터 라벨 등)'],
      ['기본 아이콘 팩(ISOFLOW) 37종', '의 아이콘 이름 다국어 번역 적용'],
      ['노드 우클릭 메뉴', '에 "노드 수정" 항목 추가 (복사 → 수정 → 연결선 추가 순)'],
      ['히스토리/도움말 버튼', ' 위치를 상단 우측 언어 전환 버튼 옆으로 이동'],
      ['다이어그램 저장/불러오기 UI', '를 상단바 다이얼로그 하나로 통합'],
      ['Undo/Redo 버튼', '을 상단 툴바로 이동 (새로 만들기 버튼 왼쪽)'],
      ['다이어그램 제목', '을 클릭해서 바로 수정 가능'],
      ['저장/불러오기/내보내기 다이얼로그', ' UI 개선 (아이콘 추가, 여백 정리)'],
      ['불러오기 버튼', '에 "세션에서 불러오기 / 파일 가져오기" 드롭다운 추가'],
      ['우클릭 메뉴', '에 아이콘 추가 (복사/추가/붙여넣기)'],
      ['노드 우클릭 메뉴', '에서 바로 "연결선 추가" 가능'],
      ['연결선 기본 색상', '을 파스텔 톤으로, 두께는 더 얇게 변경'],
      ['연결선 흐름 방향 애니메이션', ' 추가 (설정 > 연결선에서 켜고 끄기 가능)'],
      ['같은 위치', '에서 연결선 시작/끝을 선택하면 생성되지 않도록 개선'],
      ['연결선 그리는 도중 우클릭', '하면 바로 취소'],
      ['다국어 번역', ' 보강 (툴팁, 우클릭 메뉴 등)']
    ]
  }
];

const CHANGELOG_EN: ChangelogGroup[] = [
  {
    version: 'v1.8.0',
    date: '2026-08-24',
    items: [
      ['Right-click a node (long-press on mobile) → "Create Child View"', " to drill down into that item's own detail diagram (a child view) — the anchor icon stays locked in place and can't be deleted, and the Layers panel header doubles as a back-to-parent button"],
      ['Each node row in the Layers panel', ' now has its own create/open child-view icon button — a direct entry point even where right-click isn\'t available'],
      ['A child view left empty', ' is now cleaned up automatically when you navigate away, so the node\'s menu shows "Create" again instead of leaving a dead empty view behind'],
      ['Selecting a node', ' now dims every other node so the selected one stands out'],
      ['Selecting a connector', ' now highlights the line itself on the canvas, not just its two endpoint dots'],
      ['Clicking an already-selected row in the Layers panel', ' now deselects it'],
      ['The top toolbar on mobile/narrow screens', ' now switches to a horizontal layout automatically, regardless of the saved position setting'],
      ['Settings', ' also goes fullscreen on mobile, replacing the left group list with a horizontally scrollable icon-strip navigation']
    ]
  },
  {
    version: 'v1.7.0',
    date: '2026-08-20',
    items: [
      ['Layers panel search and type filter chips', ' added (All/Nodes/Connectors/Areas/Text) so items are easy to find as a diagram grows'],
      ['Layers panel grouping', ' improved to nest nodes under the area (rectangle) they sit inside, plus per-item show/lock toggles and a slide animation when the list opens/closes'],
      ['Locking an item in the Layers panel', ' now also blocks selecting it by clicking directly on the canvas — previously the lock only worked from the list'],
      ['Overlapping connectors', ' fixed always grabbing the first one on click/drag, and a stray waypoint being left behind when a drag was returned to its starting point'],
      ['Connector pairs with a waypoint', ' now group by their start/end anchors instead of anchor count, fixing overlap between grouped pairs'],
      ['Layers panel', ' now docks flush to the screen edge, with a new setting to place the toolbar at the top or on the left'],
      ['Node edit panel summary card', ' redesigned — larger icon, a "● Selected" badge, zone/connection-count/type chips, and an "Update icon" button; added a Label Display mode (Always/On Hover/Hidden) and a Connection Summary (Input/Output) section'],
      ['Clicking an entry in the Connection Summary', ' now pans the canvas to that connected node and switches the edit panel to it'],
      ['The Label Display toggle', "'s selected state was barely visible — now shown as a solid pill with strong contrast"],
      ['Layers panel search/filter/zone-summary strings', ' were showing in English regardless of locale — now translated across all 13 supported languages'],
      ['Settings redesigned', ' as a two-pane dialog — a searchable (⌘K) sidebar grouped into Shortcuts/Pan/Zoom, Display, Icon Packs, and Extensions replaces the old tab strip; Cancel now reverts anything changed while the dialog was open, Save commits it, and each section gets its own "Reset to defaults" button'],
      ['Skills panel removed', ' — the auto-arrange layout tool and its toggle are gone from Settings'],
      ['MCP panel', ' now lists the "Available Tools" a connected AI agent can call (list/get/create/update/patch/delete diagram), shown as a read-only reference under the enable toggle'],
      ['Connector mode picker', ' — Click vs. Drag connection mode is now two illustrated side-by-side cards instead of a plain radio list, plus a small animated preview of the connector flow effect'],
      ['Toolbar position picker', ' — same illustrated-card treatment for choosing where the toolbar docks'],
      ['Zoom settings visuals', ' — Zoom to Cursor and Trackpad Mode now show small before/after and gesture illustrations instead of plain switches'],
      ['Pan settings layout', ' — the pan-trigger toggles (click/hold/middle-click/etc.) are now arranged in a compact grid, and the keyboard pan-speed slider gets "Slow"/"Fast" end labels'],
      ['Icon pack logos', ' — AWS, GCP, Azure, and Kubernetes packs now show their real brand logo in the pack list instead of a generic initial badge; the built-in Isoflow pack gets its own icon badge too'],
      ['Node shadow and accent color removed', ' — the drop-shadow toggle and accent-color picker added to the node edit panel in the last update have been pulled back out, along with their effect on the node itself'],
      ['Toolbar and hotkey list order', ' — the Pan tool now appears before Select in both the toolbar and the Settings hotkey list']
    ]
  },
  {
    version: 'v1.6.1',
    date: '2026-08-14',
    items: [
      ['Self-hosting via Docker', ' fixed the MCP server failing to build, and (once built) being unreachable at the connection URL shown in Settings']
    ]
  },
  {
    version: 'v1.6.0',
    date: '2026-08-14',
    items: [
      ['MCP server support', ' added — enable it in Settings and an external AI agent can connect with the shown URL/token to read, create and edit diagrams directly'],
      ['While a diagram is being edited over MCP', ' any open tab showing that diagram updates live, no refresh needed, with an "MCP is writing..." indicator at the bottom of the screen'],
      ['Skills panel', ' added (Settings) — turn on and run AI diagram-automation features (e.g. auto-arrange)'],
      ['Text overlapping a colored area (rectangle)', ' fixed selecting the area instead of the text underneath your click — this hit zone labels placed at fine-tuned fractional coordinates especially often'],
      ['Connector lines drawn into a node\'s icon box', ' fixed the line showing through the icon artwork — it now stops right at the icon\'s edge'],
      ['A "Maximum update depth exceeded" crash', ' fixed when the app re-rendered while MCP was enabled (e.g. opening the History panel)']
    ]
  },
  {
    version: 'v1.5.0',
    date: '2026-08-11',
    items: [
      ['Flowvia is now Isenax', ' — new name, logo and banner artwork'],
      ['Layers panel', ' added — a docked list of every node/connector/area/text box on the canvas; picking one opens it in the same panel’s "Edit" tab instead of a separate floating panel over the canvas'],
      ['Export as compact JSON / Export as image / Settings / Layers', ' moved out of the hamburger menu into their own top-toolbar icons'],
      ['Mobile layout', ' — the layers panel becomes a bottom sheet (opened from a button at the bottom-right of the canvas), and toolbar icons that no longer fit move into the hamburger menu so the toolbar stays one row'],
      ['Hamburger menu', ' fixed doubled-up dividers and dead space when entries are hidden; "Clear Canvas" moved to the top'],
      ['Every top-toolbar icon', ' now shows a tooltip underneath on hover (with screen-reader labels to match)'],
      ['Tooltips', ' unified in shape and timing across the app, and now appear after 0.15s instead of 0.4s'],
      ['Locking your own diagram', ' now keeps the main menu, toolbar and zoom controls visible (unlike the read-only mode a shared link opens in)'],
      ['Load dropdown', ' fixed hiding the whole toolbar and menu while open'],
      ['Language menu', ' fixed not closing when its button was clicked a second time']
    ]
  },
  {
    version: 'v1.4.0',
    date: '2026-08-04',
    items: [
      ['Connector list', ' — collapsed rows now show thickness and label-count chips'],
      ['Connector groups with mixed overlap settings', ' fixed a middle connector overlapping the one it was trying to avoid'],
      ['Connector thickness slider', ' — lowered the minimum to 3 so it no longer looks clamped at the default width; label height/icon size in node settings now show their current value too'],
      ['Node edit panel', ' redesigned — split into Basic Info / Appearance sections, icon picker moved into a card, sliders now pair with a numeric input for exact values, Delete/Duplicate moved to a sticky bottom bar'],
      ['Connector flow animation', ' — added a speed slider, and synced the flow dots across connectors so they move in phase instead of drifting apart'],
      ['Connector drag-reorder', ' fixed getting stuck after one swap when only 2 connectors existed — dragging now shows an insertion cue and only reorders on drop'],
      ['Connector list rows', " now show each connector's start -> end node names, so unnamed connectors between the same nodes are distinguishable"],
      ['Connector reorder direction', ' fixed being reversed from the canvas — moving a connector to the top of the list now moves it to the front on canvas, not the back'],
      ['Area (rectangle) body and corner handles', ' now show move/resize cursors on hover so it is clear they are interactive'],
      ['Flat projection mode', " fixed resize handles landing off an area's actual corners"],
      ['Locked (read-only) diagrams', ' — you can now click nodes/connectors/areas to view their details; editing stays blocked']
    ]
  },
  {
    version: 'v1.3.1',
    date: '2026-08-02',
    items: [
      ['Switch (toggle) thumb', ' fixed turning invisible against the track when checked'],
      ['Two stacked switches in the connector panel (show arrow / prevent overlap)', ' fixed rendering with no gap between them, and the label sitting flush against the switch']
    ]
  },
  {
    version: 'v1.3.0',
    date: '2026-08-02',
    items: [
      ['Overall visual redesign', ' — thin borders instead of shadows, flatter buttons/sliders, and a vuesax.com-style Switch'],
      ['Hold-clicking empty canvas', ' now switches to pan mode after 0.3s (the old instant-pan-on-click behavior is still available as a setting)'],
      ['Hamburger menu', ' — removed duplicate undo/redo, moved "Clear Canvas" to the bottom as a red danger action'],
      ['Connector groups', ' — spacing now widens for thicker connectors, and arrowheads scale with connector width'],
      ['Diagram lock button', ' fixed disappearing before a diagram was saved for the first time'],
      ['A few remaining icons', ' resized to a consistent 20px (toolbar, zoom controls, dialog close buttons)']
    ]
  },
  {
    version: 'v1.2.1',
    date: '2026-08-02',
    items: [
      ['Offline support (PWA)', ' was silently broken on every build — fixed a cache path mismatch that made the install step fail']
    ]
  },
  {
    version: 'v1.2.0',
    date: '2026-08-01',
    items: [
      ['Node/rectangle/text right-click menus reordered', ' — nodes lead with Add Connector (set off by a divider), then Edit → Copy → Duplicate → Delete'],
      ['Connectors ended on an empty tile', ' now auto-connect if a node is later placed on that same tile'],
      ['Overlapping connectors', ' — fixed arrowheads bunching up at one spot, and reversed-direction connectors overlapping instead of spreading apart'],
      ['Connector list', ' — added a per-connector overlap toggle and drag-to-reorder for spacing order'],
      ['Connectors', ' — added a Reverse Direction button'],
      ['Connector line style', ' — switched from a dropdown to Solid/Dashed/Dotted buttons'],
      ['Connector edit panel', ' — title/close button now stay pinned while scrolling, added Name/Description fields, reordered sections (Name → Description → Color → Width → Line Style → Options → Labels)'],
      ['Connector right-click menu', ' — divider repositioned, tidied up the "view connectors here" wording'],
      ['Save/load/toolbar icons', ' redesigned']
    ]
  },
  {
    version: 'v1.1.1',
    date: '2026-07-31',
    items: [
      ['Docker image builds', ' fixed a failing cache-save step (the actual build/push itself was never affected)']
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-07-31',
    items: [
      ['Node descriptions', ' now collapse by default — click the arrow next to the title to expand'],
      ['Undo/Redo buttons', ' fixed a bug where they looked enabled even with nothing to undo/redo'],
      ['Node/connector/area panels', ' translated (label height, colors, connector labels, etc.)'],
      ['Base icon pack (ISOFLOW)', ' — all 37 icon names translated'],
      ['Node right-click menu', ' now has an "Edit Node" option (Copy → Edit → Add Connector)'],
      ['History/Help buttons', ' moved next to the language switcher in the top-right'],
      ['Diagram Save/Load UI', ' unified into a single top-bar dialog'],
      ['Undo/Redo', ' moved to the top toolbar (left of New)'],
      ['Diagram title', ' — click it to rename inline'],
      ['Save/Load/Export dialogs', ' redesigned (icons, tighter spacing)'],
      ['Load button', ' now offers a dropdown: load from session or import a file'],
      ['Right-click menu', ' icons added (copy/add/paste)'],
      ['Add Connector', ' directly from a node’s right-click menu'],
      ['Connector colors', ' switched to a pastel palette, thinner lines'],
      ['Connector flow animation', ' added (toggle in Settings > Connector)'],
      ['Same-spot connectors', ' no longer create a duplicate'],
      ['Right-click cancel', ' while drawing a connector'],
      ['Translation coverage', ' broadened for tooltips and the right-click menu']
    ]
  }
];

// Same reasoning as the changelog above: a KO/EN-only fallback rather than
// plumbing new keys through all 14 isenax-lib locales for a single tip.
const CONNECTOR_GROUP_TIP_KO = {
  title: '팁: 겹친 연결선 다루기',
  description:
    '한 지점에 연결선이 여러 개 겹치면, 그 지점을 우클릭했을 때 메뉴 하단에 "여기 연결선 목록 보기"와 "여기 연결선 전체 삭제"가 추가로 나타납니다.'
};

const CONNECTOR_GROUP_TIP_EN = {
  title: 'Tip: Overlapping Connectors',
  description:
    'When multiple connectors cross the same point, right-clicking there adds "View Connectors Here" and "Delete All Here" to the bottom of the menu.'
};

export const HistoryPanel = ({ locale, onClose }: Props) => {
  const { t, i18n } = useTranslation('app');
  const isKo = i18n.language.startsWith('ko');
  const changelog = isKo ? CHANGELOG_KO : CHANGELOG_EN;
  const latest = changelog[0];
  // Only the newest version starts expanded — older ones are collapsed so the
  // panel doesn't open into a wall of text from every past release.
  const [expandedVersion, setExpandedVersion] = useState<string | null>(
    latest?.version ?? null
  );

  const tips = [
    {
      title: locale.importHintTooltip.title,
      description: [
        locale.importHintTooltip.instructionStart,
        locale.importHintTooltip.menuButton,
        locale.importHintTooltip.instructionMiddle,
        locale.importHintTooltip.openButton,
        locale.importHintTooltip.instructionEnd
      ].join(' ')
    },
    {
      title: locale.connectorHintTooltip.tipCreatingConnectors,
      description: [
        locale.connectorHintTooltip.clickInstructionStart,
        locale.connectorHintTooltip.clickInstructionMiddle,
        locale.connectorHintTooltip.clickInstructionEnd
      ].join(' ')
    },
    {
      title: locale.lazyLoadingWelcome.title,
      description: locale.lazyLoadingWelcome.message
    },
    isKo ? CONNECTOR_GROUP_TIP_KO : CONNECTOR_GROUP_TIP_EN
  ];

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>
          {t('history.title')}
          {latest && (
            <span className="history-version">
              {latest.version} · {latest.date}
            </span>
          )}
          <button
            type="button"
            className="dialog-close-btn"
            onClick={onClose}
            aria-label={t('dialog.load.btnClose')}
          >
            <IconX size={18} />
          </button>
        </h2>

        <h3 className="history-section-title">{t('history.whatsNew')}</h3>
        {changelog.map((group) => {
          const isExpanded = expandedVersion === group.version;

          return (
            <div className="history-version-group" key={group.version}>
              <button
                type="button"
                className="history-version-heading history-version-heading-toggle"
                aria-expanded={isExpanded}
                onClick={() => {
                  setExpandedVersion(isExpanded ? null : group.version);
                }}
              >
                <span className={`history-version-chevron${isExpanded ? ' is-expanded' : ''}`}>
                  <IconChevronRight size={14} />
                </span>
                {group.version} · {group.date}
              </button>
              <div className={`history-version-collapse${isExpanded ? ' is-expanded' : ''}`}>
                <ul className="history-list">
                  {group.items.map(([bold, rest]) => {
                    return (
                      <li key={bold}>
                        <strong>{bold}</strong>
                        {rest}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}

        <h3 className="history-section-title">{t('history.tips')}</h3>
        <div className="history-tips">
          {tips.map((tip) => {
            return (
              <div className="history-tip" key={tip.title}>
                <strong>{tip.title}</strong>
                <p>{tip.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
