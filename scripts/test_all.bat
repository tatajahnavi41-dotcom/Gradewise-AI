@echo off
echo ========================================================
echo   Running CampusIQ Automated Test Suite
echo ========================================================

cd backend
python -m pytest tests/test_api.py -v
cd ..

echo ========================================================
echo   Tests Complete!
echo ========================================================
pause
