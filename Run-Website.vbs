' Silent launcher for the local website supervisor.
'
' wscript.exe has no console of its own, and Run() with window style 0 starts the child
' hidden. Doing it this way matters because Windows Terminal ignores -WindowStyle Hidden:
' launching PowerShell straight from Task Scheduler pops a visible black window, and closing
' that window kills the supervisor along with it.
Option Explicit

Dim shell, fso, folder, scriptPath

Set fso = CreateObject("Scripting.FileSystemObject")
folder = fso.GetParentFolderName(WScript.ScriptFullName)

Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = folder

scriptPath = fso.BuildPath(folder, "Run-Website.ps1")
If Not fso.FileExists(scriptPath) Then
    WScript.Quit 1
End If

shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptPath & """", 0, False
