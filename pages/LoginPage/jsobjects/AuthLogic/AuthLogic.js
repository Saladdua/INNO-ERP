export default {
	loginUser: async () => {
		ErrorMessageText.setText("");
		if (!EmailInput.text || !PasswordInput.text) {
			ErrorMessageText.setText("Vui lòng nhập đầy đủ email và mật khẩu.");
			return;
		}

		if (typeof CryptoJS === 'undefined') {
			showAlert("Lỗi: Thư viện mã hóa chưa sẵn sàng.", "error");
			return;
		}

		try {
			// Chạy query để tìm user bằng email
			await verifyUserCredentials.run();
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

			const hashedEnteredPassword = CryptoJS.SHA256(PasswordInput.text).toString(CryptoJS.enc.Hex);

			if (hashedEnteredPassword === userRecord.PasswordHash) {
				showAlert('Đăng nhập thành công!', 'success');

				// Lưu các thông tin cần thiết vào appsmith.store
				// Chúng ta không lưu TeamName ở đây nữa để tránh lỗi
				await storeValue('currentUserID', userRecord.UserID);
				await storeValue('currentUserEmail', userRecord.Email);
				await storeValue('currentUserFullName', userRecord.FullName);
				await storeValue('currentUserRole', userRecord.Role);
				await storeValue('currentTeamID', userRecord.TeamID);

				// Sau khi lưu xong, điều hướng đến HomePage
				navigateTo('HomePage', {}, 'SAME_WINDOW');
			} else {
				ErrorMessageText.setText("Email hoặc mật khẩu không đúng.");
			}
		} catch (error) {
			console.error("Lỗi trong quá trình đăng nhập:", error);
			ErrorMessageText.setText("Đã xảy ra lỗi hệ thống. Vui lòng thử lại.");
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