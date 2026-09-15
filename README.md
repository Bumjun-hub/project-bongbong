# project-bongbong

Windows 바탕화면 위에 봉봉 캐릭터를 띄우는 작은 데스크탑 펫 테스트 프로젝트입니다.
투명 창, Idle / Walk / Sleep, 클릭, 실제 창 드래그만 구현합니다.

## 기술과 폴더 역할

- **React + TypeScript**: 캐릭터 표시, 상태 전환, 마우스 입력, 프레임 재생.
- **CSS Modules**: 캐릭터의 픽셀 렌더링과 작은 단계식 움직임.
- **Tauri 2 + Rust**: Windows 창 생성, 투명도, 최상단 표시, 창 이동과 네이티브 드래그.
- **Vite + npm**: 프런트엔드 개발 서버, 의존성 설치 및 빌드.
- `src/`: 화면에 표시할 React 코드와 설정.
- `public/`: 그대로 복사되는 정적 이미지. 코드에서 `/character/bongbong.png`로 접근합니다.
- `src-tauri/`: Rust 코드, Windows 앱 설정, 권한, 앱 아이콘.

## 준비 및 실행

Windows에 Node.js **22.12 이상(또는 24 LTS)**, npm, Rust MSVC 툴체인,
Visual Studio C++ Build Tools(Desktop development with C++ 및 Windows SDK),
Microsoft Edge WebView2 Runtime이 필요합니다.

프로젝트 폴더의 터미널에서 실행합니다.

```powershell
npm install
npm run tauri dev
```

일반 브라우저 화면만 확인하려면 `npm run dev`를 사용합니다.
브라우저에서는 상태와 그림만 확인할 수 있고 바탕화면 창 이동은 Tauri 실행에서 확인합니다.
종료는 창에 포커스를 둔 뒤 `Alt+F4`, 개발 서버 종료는 터미널에서 `Ctrl+C`입니다.

## Production build

```powershell
npm run build
npm run tauri build
```

`npm run build`는 TypeScript 검사와 프런트엔드 빌드입니다.
`npm run tauri build`는 프런트엔드와 Rust를 빌드하고 설치 파일도 만듭니다.
결과는 `src-tauri/target/release/` 및 그 아래 `bundle/`에 생성됩니다.
Rust만 검사할 때는 `cargo check --manifest-path src-tauri/Cargo.toml`을 실행합니다.

## 캐릭터 PNG

현재 사용 중인 원본 위치는 **`public/character/bongbong.png`**입니다.
추가로 전달받은 실제 파일 위치를 유지했으며, 원본을 수정하거나 이동하지 않았습니다.
현재 세 상태 모두 이 한 장을 사용합니다. 이미지가 없거나 로드에 실패하면 작은 사각형 임시 캐릭터가 표시됩니다.

128 × 128 영역 안에서 원본 비율을 유지합니다. PNG 내부에 투명 여백이 많으면 실제 캐릭터는 더 작게 보일 수 있습니다.
`image-rendering: pixelated`를 사용하지만 원본에 이미 들어 있는 부드러운 픽셀은 자동으로 제거되지 않습니다.

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `src/App.tsx`, `src/App.css` | 캐릭터 연결, html/body/root 투명 배경 |
| `src/components/Character/Character.tsx` | 캐릭터 및 개발용 상태 표시, 프레임 재생, 이미지 실패 처리 |
| `src/components/Character/Character.module.css` | 픽셀 렌더링, 좌우 방향과 독립적인 1~2px 움직임 |
| `src/types/character.ts` | idle/walk/sleep 타입, 방향과 프레임 설정 타입 |
| `src/constants/character.ts` | 이미지, 프레임, 속도, 시간, 크기, 드래그 임계값 |
| `src/hooks/useCharacterState.ts` | 상태 순환, 일시 정지, 클릭/드래그 후 초기화, 개발 단축키 |
| `src/hooks/usePetWindow.ts` | 실제 창의 자동 이동, 방향 전환, 화면 경계 보정 |
| `src/hooks/useCharacterDrag.ts` | 클릭/드래그 구분, 공식 startDragging API, 종료 처리 |
| `src-tauri/src/lib.rs` | Windows 왼쪽 마우스 버튼 해제 확인 명령 |
| `src-tauri/tauri.conf.json` | 180 × 220 투명·테두리 없음·최상단·크기 고정·그림자 없음 |
| `src-tauri/capabilities/default.json` | main 창의 필요한 창 API 권한만 허용 |
| `src-tauri/permissions/character.toml` | 마우스 버튼 확인 명령 권한 |

## 상태와 조절 값

기본 순서는 `Idle 5초 → Walk 10초 → Idle 5초 → Sleep`입니다.
Sleep은 클릭할 때까지 유지합니다. 어느 상태에서든 클릭하면 Idle부터 다시 시작합니다.
Dragging은 CharacterState에 포함되지 않으며 별도의 `isDragging`으로 관리합니다.

`src/constants/character.ts`에서 조절합니다.

- `IDLE_DURATION`: Idle 유지 시간(ms).
- `WALK_DURATION`: Walk 유지 시간(ms).
- `WALK_SPEED`: 한 번 이동할 물리 픽셀 수. 기본 2px.
- `WALK_INTERVAL`: 이동 후 다음 이동까지 대기 시간. 기본 32ms(IPC 처리 시간 별도).
- `CHARACTER_SIZE`: 이미지 표시 영역. 기본 128px.
- `DRAG_THRESHOLD`: 클릭과 드래그 구분 거리. 기본 4 CSS px.
- `CHARACTER_ANIMATIONS`: 상태별 프레임 경로 및 프레임 간격.

자동 이동은 **주 모니터의 작업 영역**을 사용하므로 작업표시줄을 제외합니다.
물리 좌표와 실제 창 크기를 사용합니다. 좌우 끝에서는 방향을 바꾸고 왼쪽 이동 시 좌우 반전합니다.
드래그 종료 시에도 주 모니터 작업 영역으로 보정합니다. 멀티 모니터 이동은 이번 버전 범위 밖입니다.

## 드래그 처리

왼쪽 버튼을 누르면 자동 이동과 상태 타이머가 즉시 멈춥니다.
4px 이상 움직이면 Tauri 공식 `startDragging()`으로 실제 창을 옮깁니다.
이미 요청된 Walk 이동이 끝난 뒤 네이티브 드래그를 시작해 위치가 튀는 것을 줄입니다.

Windows 네이티브 이동 중에는 DOM `pointerup`이 전달되지 않을 수 있습니다.
따라서 누르고 있는 동안만 Rust의 `GetAsyncKeyState(VK_LBUTTON)`으로 버튼 해제를 확인합니다.
API의 Promise 완료를 드래그 종료로 간주하지 않습니다.
마우스를 놓으면 위치 보정 → isDragging 해제 → Idle 및 타이머 재시작 순으로 처리합니다.
드래그 뒤 발생하는 합성 click은 막아 중복 처리를 방지합니다.

## Sprite animation 추가 방법

다음처럼 PNG를 추가합니다.

```text
public/character/
  bongbong.png
  idle/idle_01.png ... idle_04.png
  walk/walk_01.png ... walk_06.png
  sleep/sleep_01.png ... sleep_04.png
```

`CHARACTER_ANIMATIONS`의 해당 상태를 다음처럼 바꾸면 됩니다.

```ts
idle: {
  frames: ["/character/idle/idle_01.png", "/character/idle/idle_02.png"],
  frameDuration: 250,
},
```

각 프레임의 캔버스 크기와 발 위치를 통일하면 프레임 전환 시 흔들림을 줄일 수 있습니다.
`src/assets/character/`를 사용하고 싶다면 constants 파일에서 이미지를 import한 후 frames 배열에 넣으면 됩니다.
컴포넌트에 이미지 경로를 넣을 필요가 없습니다.

## 수동 테스트

1. `npm run tauri dev`: 배경·제목 표시줄·테두리·그림자 없이 캐릭터가 표시되는지 확인합니다.
2. 5초 후 오른쪽으로 창이 이동하는지 확인합니다.
3. 개발 창에 포커스를 둔 뒤 `1` Idle / `2` Walk / `3` Sleep으로 즉시 전환합니다.
4. 창을 좌우 가장자리 가까이에 놓고 `2`를 눌러 반사 및 좌우 반전을 확인합니다.
5. Walk와 Sleep에서 짧게 클릭하면 Idle로 돌아가는지 확인합니다.
6. Walk와 Sleep에서 잡고 10초 이상 드래그합니다. 잡은 동안 자동 상태 전환 및 Walk가 멈춰야 합니다.
7. 놓은 위치가 유지되고 Idle로 돌아오는지, 약 5초 후 다시 걷는지 확인합니다.
8. 작은 클릭, 빠른 드래그, 화면 바깥에서 놓기를 반복해 DRAG에 고정되거나 위치가 튀지 않는지 확인합니다.
9. Windows 배율 100%/150%에서 주 모니터 경계와 작업표시줄 침범 여부를 확인합니다.
10. 개발자 도구 Console에서 React 경고와 permission 오류를 확인합니다. 상태 로그는 `[Character] IDLE/WALK/SLEEP/DRAG` 형태입니다.
11. production 실행에서 개발용 상태 텍스트와 숫자 단축키가 사라지는지 확인합니다.

자동 생성되는 개발 React StrictMode 초기 로그는 두 번 보일 수 있습니다.
`prefers-reduced-motion` 설정 시 작은 CSS 움직임은 생략합니다.

## 공개 저장소 점검

초기 파일명 및 텍스트 검색에서 인증정보, 환경변수 파일, private key, 하드코딩된 토큰은 발견되지 않았습니다.
이 결과는 현재 파일 검사 범위이며 과거 Git 이력이나 외부 서비스의 키 유효성 검증은 포함하지 않습니다.
이미 추적한 민감정보는 `.gitignore`만 추가해도 사라지지 않습니다. 발견 시 키 폐기/교체와 Git 이력 정리가 필요합니다.

`node_modules`, `dist`, Rust `target`, Tauri 생성 스키마, 로그, 로컬 환경변수, IDE 임시 파일은 제외합니다.
`package-lock.json`, `Cargo.lock`, 소스, 앱 아이콘, 캐릭터 PNG는 재현 가능한 빌드에 필요한 공개 대상입니다.
`.env.example`은 실제 비밀값 없이 예시 값만 넣어야 합니다.

참고: [Tauri Window API](https://v2.tauri.app/reference/javascript/api/namespacewindow/),
[Windows 개발 준비](https://v2.tauri.app/start/prerequisites/).
