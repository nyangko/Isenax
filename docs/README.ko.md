<div align="center">

<img src="../assets/banner.png" alt="Isenax - 오픈소스 아이소메트릭 다이어그램 도구" width="100%" />

</div>



<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## 참고:
이 저장소(Isenax)는 [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW)의 파생 프로젝트이며, 이는 다시 stan-smith/FossFLOW의 포크(이 역시 [markmanx/isoflow](https://github.com/markmanx/isoflow)의 포크)로, 원래는 PR을 통해 원본 저장소에 기여하기 위해 만들어졌습니다. 하지만 원작자의 GitHub 사용자명이 [mug-book-droid](https://github.com/mug-book-droid)로 변경되고 활동이 비공개로 전환되면서(계정 정지 가능성도 있음) 원본 저장소에 접근할 수 없게 되었습니다.

현재는 이 저장소(Isenax로 개명)를 FossFLOW의 개발 연속선상에서 이어가려 하고 있으며, PR을 통한 기여도 언제든 환영합니다.

원본 저장소의 마지막 상태는 `backup/stan-smith-FossFLOW` 브랜치에서 확인할 수 있습니다.

---

Isenax는 아름다운 아이소메트릭 다이어그램을 만들 수 있는 강력한 오픈소스 프로그레시브 웹 앱(PWA)입니다. React와 <a href="https://github.com/markmanx/isoflow">Isoflow</a> 라이브러리(포크되어 npm에 fossflow로, 이 저장소에서는 isenax로 배포됨) 기반으로 만들어졌으며, 브라우저에서 완전히 동작하고 오프라인도 지원합니다.

---
<p align="center">
<b>온라인으로 사용해보기 --> https://nyangko.github.io/Isenax/ <-- </b>
</p>
 
<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="../assets/screenshot.jpg" />

---------

## 🐳 Docker로 빠르게 배포하기

```bash
# Docker Compose 사용 (권장 - 영구 저장소 포함)
docker compose up

# 또는 Docker Hub에서 직접 실행 (영구 저장소 포함)
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

Docker에서는 서버 저장소가 기본으로 활성화되어 있습니다. 다이어그램은 호스트의 `./diagrams` 경로에 (기본적으로 root 권한으로) 저장됩니다. 저장 시 사용할 사용자/그룹 ID를 바꾸려면 `PUID`, `PGID` 환경 변수를 설정하세요.

서버 저장소를 비활성화하려면 `ENABLE_SERVER_STORAGE=false`를 설정하세요:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### HTTP 기본 인증 (선택)

HTTP Basic Auth로 Isenax 인스턴스를 보호할 수 있습니다:

```bash
# Docker Compose 사용 시
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# 또는 docker run 사용 시
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **참고**: 두 변수를 모두 설정해야 인증이 활성화됩니다. 둘 중 하나라도 비어있으면 로그인 없이 접근 가능합니다.

## 빠른 시작 (로컬 개발)

```bash
# 저장소 클론
git clone https://github.com/nyangko/Isenax
cd Isenax

# 의존성 설치
npm install

# 라이브러리 빌드 (최초 1회 필요)
npm run build:lib

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어주세요.

## 모노레포 구조

이 저장소는 네 개의 패키지로 구성된 모노레포입니다:

- `packages/isenax-lib` - 네트워크 다이어그램을 그리는 React 컴포넌트 라이브러리 (Rslib/Rspack으로 빌드)
- `packages/isenax-app` - 라이브러리를 감싸서 보여주는 프로그레시브 웹 앱 (RSBuild로 빌드)
- `packages/isenax-backend` - 다이어그램의 선택적 자체 호스팅 저장소를 제공하는 Express 서버 (Docker 배포에 사용)
- `packages/isenax-mcp` - 외부 AI 에이전트가 다이어그램을 직접 읽고 만들고 수정할 수 있게 해주는 MCP(Model Context Protocol) 서버 (stdio 또는 Streamable HTTP)

### 개발 명령어

```bash
# 개발
npm run dev          # 앱 개발 서버 실행
npm run dev:lib      # 라이브러리 워치 모드

# 빌드
npm run build        # 라이브러리와 앱 모두 빌드
npm run build:lib    # 라이브러리만 빌드
npm run build:app    # 앱만 빌드

# 테스트 & 린트
npm test             # 유닛 테스트 실행
npm run lint         # 린트 오류 확인

# E2E 테스트 (Selenium)
cd e2e-tests
./run-tests.sh       # 엔드투엔드 테스트 실행 (Docker & Python 필요)

# 배포
npm run publish:lib  # 라이브러리를 npm에 배포
```

## 사용 방법

### 다이어그램 만들기

1. **아이템 추가하기**:
   - 우측 상단 메뉴의 "+" 버튼을 누르면 왼쪽에 컴포넌트 라이브러리가 나타납니다
   - 라이브러리에서 캔버스로 컴포넌트를 드래그 앤 드롭하세요
   - 또는 그리드에서 우클릭 후 "노드 추가"를 선택하세요

2. **아이템 연결하기**:
   - 커넥터 도구를 선택하세요 ('C' 키 또는 커넥터 아이콘 클릭)
   - **클릭 모드** (기본값): 첫 번째 노드를 클릭한 뒤 두 번째 노드를 클릭
   - **드래그 모드** (선택): 첫 번째 노드에서 두 번째 노드까지 클릭한 채로 드래그
   - 설정 → 커넥터 탭에서 모드를 전환할 수 있습니다

3. **작업 저장하기**:
   - **빠른 저장** - 브라우저 세션에 저장
   - **내보내기** - JSON 파일로 다운로드
   - **가져오기** - JSON 파일에서 불러오기

4. **레이어 패널로 정리하기**:
   - 툴바의 레이어 버튼을 누르면 캔버스의 모든 노드/연결선/영역/텍스트가 하나의 목록으로 표시됩니다
   - 목록에서 항목을 선택하면 같은 패널의 "편집" 탭에서 바로 수정할 수 있습니다
   - 좁은 화면에서는 캔버스 우측 하단 버튼을 눌러 하단 시트로 열립니다

### 저장 옵션

- **세션 저장소**: 브라우저를 닫으면 사라지는 임시 저장
- **내보내기/가져오기**: JSON 파일로 영구 저장
- **자동 저장**: 5초마다 세션에 자동으로 변경사항 저장

### MCP 연동 (AI 에이전트)

Isenax는 외부 AI 에이전트(Claude 등)가 다이어그램을 직접 읽고 만들고 수정할 수 있도록 MCP 서버를 함께 제공합니다:

1. **설정 → MCP**를 열고 켜면 연결 URL과 Bearer 토큰이 표시됩니다.
2. 이 URL/토큰으로 MCP 클라이언트를 연결하세요 (`packages/isenax-mcp`는 stdio와 Streamable HTTP 트랜스포트를 모두 지원합니다).
3. 에이전트가 수정하면 그 다이어그램이 열려 있는 브라우저 탭에 새로고침 없이 바로 반영됩니다 — 작업 중에는 "MCP로 작성 중..." 표시가 나타납니다.

내장 아이콘은 id만으로 왕복하고(base64 데이터를 에이전트에 보내지 않음), `update_diagram_patch` 툴로 변경된 필드만 보내 전체 모델을 다시 보내지 않아도 됩니다.

## 최근 추가된 기능

### 하위 뷰로 드릴다운
노드를 우클릭(모바일에서는 길게 누르기)하고 "하위 뷰 만들기"를 선택하면 그 아이템만의 상세 다이어그램으로 들어갈 수 있습니다. 진입점 아이콘은 고정되어 있어 삭제할 수 없으므로 지금 보고 있는 뷰가 누구의 상세인지 항상 알 수 있고, 레이어 패널 헤더가 상위 뷰로 돌아가는 버튼을 겸합니다. 레이어 패널의 각 노드 행에도 동일한 기능의 생성/열기 아이콘이 추가되었습니다.

### 선택 시 시각적 구분 강화
노드를 선택하면 다른 노드들이 흐려져서 선택된 노드가 더 잘 구분되고, 연결선을 선택하면 양 끝 점뿐 아니라 선 자체가 캔버스에서 하이라이트되며, 레이어 패널에서 이미 선택된 항목을 다시 클릭하면 선택이 해제됩니다.

### 모바일 반응형 툴바와 설정 화면
좁은 화면에서는 저장된 위치 설정과 무관하게 상단 툴바가 자동으로 가로 배치로 전환되고, 설정 화면도 전체화면으로 열리며 좌측 목록 대신 가로로 스크롤되는 아이콘 스트립 내비게이션을 사용합니다.

### 설정 화면 개편
검색(⌘K) 기능을 갖춘 2단 구성의 설정 대화상자가 기존 탭 방식을 대체합니다 — 단축키/패닝/줌, 화면 표시, 아이콘 팩, 확장 기능으로 그룹화되었으며, 취소/저장 방식과 섹션별 "기본값으로 초기화" 버튼을 제공합니다.

### 레이어 패널
검색과 유형 필터(전체/노드/커넥터/영역/텍스트), 영역 안에 속한 노드의 중첩 표시, 항목별 표시/잠금 토글을 지원하며, 이제 패널이 화면 가장자리에 딱 붙어 도킹되고 툴바 위치도 설정할 수 있습니다.

### 노드 편집 패널
더 큰 아이콘과 선택 배지, 구역/연결/유형 칩을 갖춘 요약 카드로 새로 디자인되었고, 라벨 표시 모드(항상/호버 시/숨김)와 클릭하면 연결된 노드로 캔버스를 이동시키는 연결 요약 기능이 추가되었습니다.

### MCP 도구 연동
설정 → MCP 패널에서 이제 연결된 AI 에이전트가 호출할 수 있는 도구 목록(다이어그램 조회/가져오기/생성/수정/패치/삭제)을 보여줍니다.

### 아이콘 팩 브랜드 로고
AWS, GCP, Azure, Kubernetes 아이콘 팩이 설정 화면에서 일반 이니셜 배지 대신 실제 브랜드 로고를 표시합니다.

### 커넥터 다중화
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### 아이템 복사/붙여넣기
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />


## 기여하기

기여를 환영합니다! 가이드라인은 [CONTRIBUTING.md](../CONTRIBUTING.md)를 참고해주세요.

## 문서

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - 코드베이스에 대한 종합 가이드
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 기여 가이드라인

## 라이선스

MIT
