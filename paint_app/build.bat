@echo off
chcp 65001 >nul
echo ====================================
echo  그림판 빌드 스크립트
echo ====================================
echo.

:: 1. Pillow 설치 확인
echo [1/3] 의존성 확인 중...
pip install pillow pyinstaller --quiet
if %errorlevel% neq 0 (
    echo [오류] pip install 실패
    pause & exit /b 1
)

:: 2. PyInstaller로 .exe 빌드
echo [2/3] .exe 파일 빌드 중...
pyinstaller ^
    --onefile ^
    --windowed ^
    --name "그림판" ^
    --icon NONE ^
    paint.py

if %errorlevel% neq 0 (
    echo [오류] PyInstaller 빌드 실패
    pause & exit /b 1
)

echo.
echo [3/3] 완료!
echo   실행 파일: dist\그림판.exe
echo.
echo ※ 설치 파일(setup.exe)을 만들려면:
echo    Inno Setup (https://jrsoftware.org/isinfo.php) 설치 후
echo    setup.iss 파일을 열고 컴파일하세요.
echo.
pause
