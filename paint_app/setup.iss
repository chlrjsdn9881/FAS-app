; 그림판 Inno Setup 스크립트
; Inno Setup 6.x 이상 필요: https://jrsoftware.org/isinfo.php

[Setup]
AppName=그림판
AppVersion=1.0
AppPublisher=학생
DefaultDirName={autopf}\그림판
DefaultGroupName=그림판
OutputDir=installer
OutputBaseFilename=그림판_setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\그림판.exe

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"

[Tasks]
Name: "desktopicon"; Description: "바탕 화면에 바로 가기 만들기"; GroupDescription: "추가 작업:"; Flags: unchecked

[Files]
; PyInstaller 빌드 후 dist\ 폴더의 exe를 사용
Source: "dist\그림판.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\그림판";         Filename: "{app}\그림판.exe"
Name: "{group}\그림판 제거"; Filename: "{uninstallexe}"
Name: "{commondesktop}\그림판"; Filename: "{app}\그림판.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\그림판.exe"; Description: "그림판 실행"; Flags: nowait postinstall skipifsilent
