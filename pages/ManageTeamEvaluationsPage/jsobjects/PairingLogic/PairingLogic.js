export default {
    // Hàm này được gọi khi lựa chọn trong Multiselect/CheckboxGroup của một đội thay đổi
    updateSelectionsForTeam: async (managingTeamID, selectedPartnerIDs) => {
        // selectedPartnerIDs là một mảng các TeamID mà managingTeamID muốn đánh giá cùng.

        // 1. Lấy danh sách các cặp hiện tại mà managingTeamID đang tham gia
        const currentPairsInvolvingManagingTeam = (getEvaluationPairs.data || []).filter(p =>
            p.TeamA_ID === managingTeamID || p.TeamB_ID === managingTeamID
        );

        const currentlyPairedWith = new Set();
        currentPairsInvolvingManagingTeam.forEach(pair => {
            if (pair.TeamA_ID === managingTeamID) {
                currentlyPairedWith.add(pair.TeamB_ID);
            } else { // pair.TeamB_ID === managingTeamID
                currentlyPairedWith.add(pair.TeamA_ID);
            }
        });

        const newSelections = new Set(selectedPartnerIDs);

        // 2. Xác định các cặp cần thêm mới
        for (const partnerID of newSelections) {
            if (!currentlyPairedWith.has(partnerID)) {
                // Đây là một cặp mới cần được thêm
                const teamA = managingTeamID < partnerID ? managingTeamID : partnerID;
                const teamB = managingTeamID < partnerID ? partnerID : managingTeamID;
                const newPairID = `<span class="math-inline">\{teamA\}\-</span>{teamB}`;

                // Kiểm tra kỹ để tránh tạo trùng lặp nếu getEvaluationPairs.data chưa kịp cập nhật
                if (!(getEvaluationPairs.data || []).find(p => p.PairID === newPairID)) {
                    try {
                        await createPairingQuery.run({
                            pairIdToInsert: newPairID,
                            teamA_IdToInsert: teamA,
                            teamB_IdToInsert: teamB
                        });
                        console.log("Đã tạo cặp:", newPairID);
                    } catch (e) {
                        showAlert(`Lỗi khi tạo cặp với ${partnerID}: ${e.message}`, 'error');
                    }
                }
            }
        }

        // 3. Xác định các cặp cần xóa
        for (const partnerID of currentlyPairedWith) {
            if (!newSelections.has(partnerID)) {
                // Cặp này đã bị bỏ chọn, cần xóa
                const teamA = managingTeamID < partnerID ? managingTeamID : partnerID;
                const teamB = managingTeamID < partnerID ? partnerID : managingTeamID;
                const pairIdToDelete = `<span class="math-inline">\{teamA\}\-</span>{teamB}`;

                const pairObjectToDelete = (getEvaluationPairs.data || []).find(p => p.PairID === pairIdToDelete);
                if (pairObjectToDelete && pairObjectToDelete.rowIndex !== undefined) {
                    try {
                        await deletePairingQuery.run({ rowIndexToDelete: pairObjectToDelete.rowIndex });
                        console.log("Đã xóa cặp:", pairIdToDelete);
                    } catch (e) {
                        showAlert(`Lỗi khi xóa cặp với ${partnerID}: ${e.message}`, 'error');
                    }
                } else if (pairObjectToDelete) {
                     console.error("Lỗi: Không tìm thấy rowIndex cho cặp cần xóa:", pairIdToDelete, pairObjectToDelete);
                     showAlert(`Lỗi hệ thống: Không thể xác định dòng để xóa cặp ${pairIdToDelete}.`, 'error');
                }
            }
        }

        // 4. Làm mới danh sách cặp và hiển thị thông báo
        await getEvaluationPairs.run();
        showAlert('Đã cập nhật lựa chọn đánh giá!', 'success');
    }
}