export default {
    submitForm: async () => {
        // Lấy danh sách các tiêu chí từ query
        const criteriaData = getCriteriaForForm.data;
        // Mảng để chứa các đối tượng đánh giá sẽ được chèn vào Google Sheet
        const evaluationsToInsert = [];
        // Cờ để kiểm tra xem tất cả các điểm đã được nhập hay chưa
        let allScoresValidAndEntered = true;

        // Kiểm tra xem criteriaData có phải là mảng và có phần tử không
        if (!Array.isArray(criteriaData) || criteriaData.length === 0) {
            showAlert('Không có dữ liệu tiêu chí để xử lý. Vui lòng kiểm tra query getCriteriaForForm.', 'error');
            return;
        }

        // Vòng lặp qua từng tiêu chí để lấy điểm từ Input widget tương ứng
        for (let i = 0; i < criteriaData.length; i++) {
            const criterion = criteriaData[i];

            // Kiểm tra xem criterion và CriterionID có tồn tại không
            if (!criterion || !criterion.CriterionID) {
                console.warn(`Tiêu chí thứ ${i+1} không hợp lệ hoặc thiếu CriterionID.`);
                allScoresValidAndEntered = false; // Coi như lỗi nếu dữ liệu tiêu chí không đúng
                break;
            }

            // Tạo tên widget dựa trên CriterionID (ví dụ: "score_TC1", "score_TC11")
            const inputWidgetName = `score_${criterion.CriterionID}`;
            // Truy cập Input widget bằng tên của nó thông qua đối tượng toàn cục globalThis
            const scoreWidget = globalThis[inputWidgetName];

            // Kiểm tra xem widget có thực sự tồn tại trên canvas không
            if (!scoreWidget) {
                console.error(`Lỗi cấu hình: Không tìm thấy Input Widget với tên "${inputWidgetName}" cho tiêu chí "${criterion.CriterionName || criterion.CriterionID}". Vui lòng kiểm tra lại tên widget trên canvas.`);
                showAlert(`Lỗi: Không tìm thấy ô nhập điểm cho "${criterion.CriterionName || criterion.CriterionID}".`, 'error');
                allScoresValidAndEntered = false;
                break; // Dừng vòng lặp nếu có lỗi cấu hình nghiêm trọng
            }

            const scoreText = scoreWidget.text;

            // Kiểm tra nếu ô điểm trống (null hoặc undefined)
            // Dựa trên ghi chú của bạn: "trong trường hợp điền là "0" có nghĩa là đang đánh giá tiêu chí đó 0 điểm!"
            // Vậy, chỉ coi là chưa nhập nếu nó là null hoặc undefined. Chuỗi rỗng "" có thể coi là 0 nếu parseFloat xử lý được.
            if (scoreText === null || scoreText === undefined) {
                showAlert(`Vui lòng điền điểm cho tiêu chí: "${criterion.CriterionName || criterion.CriterionID}".`, 'warning');
                allScoresValidAndEntered = false;
                break; // Dừng nếu có ô điểm quan trọng bị bỏ trống
            }

            // Chuyển đổi điểm sang số. Nếu không hợp lệ (NaN), coi như lỗi.
            const scoreValue = parseFloat(scoreText);
            if (isNaN(scoreValue)) {
                 // Nếu người dùng nhập chữ thay vì số, hoặc chuỗi rỗng mà không muốn coi là 0
                 // Với `parseFloat(scoreWidget.text || 0)` ở dưới, chuỗi rỗng sẽ thành 0.
                 // Nếu bạn muốn chuỗi rỗng là lỗi, thì bỏ `|| 0` và kiểm tra NaN ở đây.
                 // Hiện tại, `|| 0` sẽ xử lý chuỗi rỗng thành 0.
                 // Chúng ta sẽ dựa vào `parseFloat` và kiểm tra NaN sau khi push vào mảng.
            }

            evaluationsToInsert.push({
                "TeamID": appsmith.URL.queryParams.teamId,
                "CriterionID": criterion.CriterionID,
                // Sử dụng `scoreText || 0` để nếu ô input trống (sau khi trim vẫn rỗng) thì coi là điểm 0.
                // Hoặc `scoreText` nếu bạn muốn `parseFloat` tự xử lý (chuỗi rỗng thành NaN)
                "Score": parseFloat(scoreText || "0"), // Đảm bảo "0" nếu trống, để parseFloat không trả về NaN cho chuỗi rỗng
                "EvaluatorEmail": appsmith.user.email,
                "Timestamp": moment().toISOString() //Sử dụng moment.js để lấy timestamp chuẩn ISO
            });
        }

        // Nếu có lỗi trong quá trình thu thập dữ liệu điểm (ví dụ: widget không tìm thấy, ô trống không được phép)
        if (!allScoresValidAndEntered) {
            // Thông báo lỗi cụ thể hơn đã được hiển thị bên trong vòng lặp
            return;
        }
        
        // Kiểm tra lại nếu có điểm nào là NaN sau khi parse (dù đã cố gắng || "0")
        if (evaluationsToInsert.some(e => isNaN(e.Score))) {
            showAlert('Một hoặc nhiều điểm nhập không hợp lệ. Vui lòng kiểm tra lại.', 'error');
            return;
        }

        // Nếu không có đánh giá nào được thêm vào mảng (ví dụ: criteriaData rỗng)
        if (evaluationsToInsert.length === 0 && criteriaData.length > 0) {
            showAlert('Không có điểm nào được thu thập để lưu. Vui lòng kiểm tra lại.', 'warning');
            return;
        }
        if (evaluationsToInsert.length === 0 && criteriaData.length === 0) {
            showAlert('Không có tiêu chí nào để đánh giá.', 'info');
            return;
        }


        // Tiến hành lưu dữ liệu nếu mọi thứ hợp lệ
        try {
						await insertEvaluationDataQuery.run({ rows: evaluationsToInsert });
						await updateTeamStatusQuery.run({ teamId: appsmith.URL.queryParams.teamId, isEvaluated: true }); // isEvaluated ở đây có thể dùng để chỉ team đó đã có người đánh giá, khác với trạng thái của từng cá nhân.

						showAlert('Đánh giá đã được lưu thành công!', 'success');

						// Điều hướng về trang Dashboard
						navigateTo('TeamDashboardPage', {}, 'SAME_WINDOW');

        } catch (error) {
            console.error("Lỗi khi lưu đánh giá:", error);
            showAlert('Lỗi khi lưu đánh giá: ' + error.message, 'error');
        }
			
			
    }
}
