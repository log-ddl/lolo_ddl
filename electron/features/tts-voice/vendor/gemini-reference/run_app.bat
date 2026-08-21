@echo off
cd /d "%~dp0"

echo ==============================================
echo       KHOI DONG VOICE AI STANDALONE
echo ==============================================

echo [1] Kiem tra Python...
python --version
if errorlevel 1 goto NO_PYTHON

echo [2] Kiem tra moi truong ao...
if exist "venv\Scripts\python.exe" goto VENV_EXISTS

echo Dang tao moi truong ao venv...
python -m venv venv
if errorlevel 1 goto VENV_ERROR
echo Tao thanh cong.

:VENV_EXISTS
echo [3] Kich hoat moi truong ao...
call venv\Scripts\activate.bat

echo [4] Cai dat thu vien...
python -m pip install -r requirements.txt

echo [5] Chay ung dung main.py...
python main.py

echo.
echo [6] Ung dung da dong hoac co loi xay ra.
pause
exit /b

:NO_PYTHON
echo [Loi] Khong tim thay Python. Vui long cai dat vao he thong va tich 'Add to PATH'.
pause
exit /b

:VENV_ERROR
echo [Loi] Khong the tao moi truong ao.
pause
exit /b
