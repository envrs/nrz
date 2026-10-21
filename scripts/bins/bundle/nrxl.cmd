@ECHO off
SETLOCAL
SET "ROOT_DIR=%~dp0..\..\.."
IF NOT EXIST "%ROOT_DIR%\.build-bundle\nrxl.js" (
  pushd "%ROOT_DIR%"
  nrx nrz-build --bins=nrxl --outdir=".build-bundle" bundle > NUL 2>&1
  popd
)
SET "NODE_OPTIONS=--no-warnings --enable-source-maps"
node "%ROOT_DIR%\.build-bundle\nrxl.js" %*
