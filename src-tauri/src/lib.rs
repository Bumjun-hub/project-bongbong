// Detect release even when the cursor leaves the character window.
#[tauri::command]
async fn left_mouse_down() -> bool {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetAsyncKeyState, VK_LBUTTON};
        // SAFETY: This function takes a virtual-key code, with no pointers.
        unsafe { GetAsyncKeyState(VK_LBUTTON as i32) < 0 }
    }
    #[cfg(not(target_os = "windows"))]
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![left_mouse_down])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
