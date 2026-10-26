' ============================================================================
'  Pinokio AI Studio — lanceur silencieux (aucune fenêtre noire)
'  Double-cliquez ce fichier, ou utilisez le raccourci du Bureau.
' ============================================================================
Option Explicit

Dim fso, shell, base, command
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

base = fso.GetParentFolderName(WScript.ScriptFullName)

If Not fso.FileExists(base & "\Launcher.ps1") Then
  MsgBox "Launcher.ps1 est introuvable dans : " & base & vbCrLf & vbCrLf & _
         "Le dossier de l'application est incomplet.", vbCritical, "Pinokio AI Studio"
  WScript.Quit 1
End If

command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & base & "\Launcher.ps1"""

' 0 = fenêtre cachée, False = ne pas attendre la fin
shell.Run command, 0, False
