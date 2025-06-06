export default {
    currentUserDetails: {},

    getCurrentUserDetails: async () => {
        try {
            const userRecordArray = await queryGetUserDetailsByEmail.run(); // Query này sẽ dùng appsmith.user.email
            if (userRecordArray && userRecordArray.length > 0) {
                const userDetails = userRecordArray[0];
                await storeValue('currentUserDetails', userDetails, false);
                console.log("User details loaded:", appsmith.store.currentUserDetails);
                return userDetails;
            } else {
                showAlert('Không tìm thấy thông tin người dùng (' + appsmith.user.email + ') trong DB. Vui lòng liên hệ Admin.', 'error');
                await storeValue('currentUserDetails', null, false);
                return null;
            }
        } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            showAlert('Lỗi truy vấn thông tin người dùng: ' + error.message, 'error');
            await storeValue('currentUserDetails', null, false);
            return null;
        }
    },

    getStoredUserDetail: (propertyName) => {
        if (appsmith.store.currentUserDetails && appsmith.store.currentUserDetails.hasOwnProperty(propertyName)) {
            return appsmith.store.currentUserDetails[propertyName];
        }
        return null;
    }
}