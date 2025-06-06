export default {
    loginUser: async () => {
        ErrorMessageText.setText(""); // Xóa thông báo lỗi cũ

        if (!EmailInput.text || !PasswordInput.text) {
            ErrorMessageText.setText("Vui lòng nhập email và mật khẩu.");
            return;
        }

        try {
            await verifyUserCredentials.run(); // Query kiểm tra email và lấy thông tin user
            const userData = verifyUserCredentials.data;

            if (!userData || userData.length === 0) {
                ErrorMessageText.setText("Email hoặc mật khẩu không đúng.");
                return;
            }

            const userRecord = userData[0];

            if (userRecord.IsActive !== true && userRecord.IsActive !== "TRUE") {
                ErrorMessageText.setText("Tài khoản của bạn đã bị vô hiệu hóa.");
                return;
            }

            // Giả sử bạn có CryptoJS và đã import thư viện
            if (typeof CryptoJS === 'undefined') {
                // ... (xử lý lỗi CryptoJS không tải được như trước) ...
                showAlert("Thư viện CryptoJS chưa được tải. Không thể xác thực.", "error");
                return;
            }

            const enteredPassword = PasswordInput.text;
            const hashedPasswordFromSheet = userRecord.PasswordHash;
            const hashedEnteredPassword = CryptoJS.SHA256(enteredPassword).toString(CryptoJS.enc.Hex);

            if (hashedEnteredPassword === hashedPasswordFromSheet) {
                // Đăng nhập thành công, lưu thông tin vào appsmith.store
                await storeValue('currentUserID', userRecord.UserID);
                await storeValue('currentUserEmail', userRecord.Email);
                await storeValue('currentUserFullName', userRecord.FullName);
                await storeValue('currentUserRole', userRecord.Role); // QUAN TRỌNG
                await storeValue('currentTeamID', userRecord.TeamID);

                showAlert('Đăng nhập thành công!', 'success');
                // Điều hướng đến HomePage
                navigateTo('Home', {}, 'SAME_WINDOW'); // SỬA Ở ĐÂY
            } else {
                ErrorMessageText.setText("Email hoặc mật khẩu không đúng.");
            }

        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            ErrorMessageText.setText("Đã xảy ra lỗi trong quá trình đăng nhập.");
        }
    },

    logoutUser: async () => {
        // ... (như trước, xóa store và navigateTo('LoginPage')) ...
        await storeValue('currentUserID', undefined);
        await storeValue('currentUserEmail', undefined);
        await storeValue('currentUserFullName', undefined);
        await storeValue('currentUserRole', undefined);
        await storeValue('currentTeamID', undefined);
        navigateTo('LoginPage', {}, 'SAME_WINDOW');
				showAlert('Đã đăng xuất thành công.', 'success');
    },
	
		checkManagerPageAccess: () => {
        const currentUserRole = appsmith.store.currentUserRole;

        // Kiểm tra xem người dùng đã đăng nhập và có vai trò là "LanhDao" chưa
        if (!currentUserRole) {
            // Nếu không có thông tin vai trò (chưa đăng nhập hoặc có lỗi), chuyển về trang đăng nhập
            showAlert('Vui lòng đăng nhập để tiếp tục.', 'warning');
            navigateTo('LoginPage', {}, 'SAME_WINDOW');
            return false; //  Không cho phép truy cập
        }

        if (currentUserRole !== "LanhDao") {
            // Nếu vai trò không phải là "LanhDao", hiển thị thông báo và/hoặc chuyển hướng
            showAlert('Bạn không có quyền truy cập trang này.', 'error');
            // Tùy chọn: Chuyển hướng về một trang chung hoặc trang dashboard của họ
            navigateTo('Home', {}, 'SAME_WINDOW'); // Hoặc một trang "Access Denied"
            return false; // Không cho phép truy cập
        }

        return true; // Cho phép truy cập nếu là "LanhDao"
    }
	
}
// QUAN TRỌNG: Để băm mật khẩu an toàn phía client trong Appsmith,
// bạn cần import một thư viện như crypto-js.
// Cách import thư viện vào Appsmith:
// 1. Vào Project Settings (biểu tượng bánh răng) -> Libraries -> Install New
// 2. Tìm và cài đặt crypto-js (ví dụ: npm package name là 'crypto-js')
// 3. URL có thể là từ CDN, ví dụ: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
//    (Kiểm tra phiên bản mới nhất trên CDNJS hoặc tương tự)
// 4. Tên biến toàn cục thường là CryptoJS