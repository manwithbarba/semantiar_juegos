@echo off
title SEMANTIAR Juegos
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-local.ps1"
