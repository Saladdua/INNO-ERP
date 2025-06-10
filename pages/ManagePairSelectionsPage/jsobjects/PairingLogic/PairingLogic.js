export default {
	updateSelectionsForTeam: async (managingTeamID, selectedPartnerIDs) => {
		// Log dữ liệu đầu vào để kiểm tra
		console.log("Managing Team:", managingTeamID);
		console.log("New Selections:", selectedPartnerIDs);

		const existingPairs = getEvaluationPairs.data || [];

		const currentlyPairedWith = new Set();
		existingPairs.forEach(pair => {
			if (pair.TeamA_ID === managingTeamID) currentlyPairedWith.add(pair.TeamB_ID);
			if (pair.TeamB_ID === managingTeamID) currentlyPairedWith.add(pair.TeamA_ID);
		});
		console.log("Currently Paired With:", Array.from(currentlyPairedWith));

		const newSelections = new Set(selectedPartnerIDs);

		// Xử lý các cặp cần thêm mới
		for (const partnerID of newSelections) {
			if (!currentlyPairedWith.has(partnerID)) {
				const teamA = managingTeamID < partnerID ? managingTeamID : partnerID;
				const teamB = managingTeamID < partnerID ? partnerID : managingTeamID;
				const newPairID = `${teamA}-${teamB}`;
				console.log("Attempting to ADD pair:", newPairID);
				await createPairingQuery.run({ pairIdToInsert: newPairID, teamA_IdToInsert: teamA, teamB_IdToInsert: teamB });
			}
		}

		// Xử lý các cặp cần xóa
		for (const partnerID of currentlyPairedWith) {
			if (!newSelections.has(partnerID)) {
				const teamA = managingTeamID < partnerID ? managingTeamID : partnerID;
				const teamB = managingTeamID < partnerID ? partnerID : managingTeamID;
				const pairIdToDelete = `${teamA}-${teamB}`;
				const pairObjectToDelete = existingPairs.find(p => p.PairID === pairIdToDelete);
				if (pairObjectToDelete && pairObjectToDelete.rowIndex !== undefined) {
					console.log("Attempting to DELETE pair:", pairIdToDelete, "at rowIndex:", pairObjectToDelete.rowIndex);
					await deletePairingQuery.run({ rowIndexToDelete: pairObjectToDelete.rowIndex });
				} else {
					console.error("Could not find pair ot rowIndex to delete for:", pairIdToDelete);
					showAlert('Lỗi hệ thống: Không thể xác định dòng để xóa cặp ${pairIdToDelete}.', 'error');
				}
			}
		}

		await getEvaluationPairs.run();
		showAlert('Đã cập nhật lựa chọn!', 'success');
	}
}
