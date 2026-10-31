; NSIS script to integrate OrbitDrop into Windows File Explorer Context Menu
!macro customInstall
  DetailPrint "Menambahkan integrasi File Explorer Context Menu untuk OrbitDrop..."
  WriteRegStr HKCU "Software\Classes\*\shell\OrbitDrop" "" "Konversi dengan OrbitDrop"
  WriteRegStr HKCU "Software\Classes\*\shell\OrbitDrop" "Icon" "$INSTDIR\OrbitDrop.exe,0"
  WriteRegStr HKCU "Software\Classes\*\shell\OrbitDrop\command" "" '"$INSTDIR\OrbitDrop.exe" "%1"'
!macroend

!macro customUninstall
  DetailPrint "Menghapus integrasi File Explorer Context Menu OrbitDrop..."
  DeleteRegKey HKCU "Software\Classes\*\shell\OrbitDrop"
!macroend
