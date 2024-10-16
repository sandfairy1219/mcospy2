@echo off
cd /d ./dist/scripts
frida -Uf com.gameparadiso.milkchoco -l test.js