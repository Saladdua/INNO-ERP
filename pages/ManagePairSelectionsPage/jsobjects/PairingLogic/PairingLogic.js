export default {
    updateSelectionsForTeam: async (managingTeamID, selectedPartnerIDs) => {
        const existingPairs = getEvaluationPairs.data || [];
        
        const currentlyPairedWith = new Set();
        existingPairs.forEach(pair => {
            if (pair.TeamA_ID === managingTeamID) currentlyPairedWith.add(pair.TeamB_ID);
            if (pair.TeamB_ID === managingTeamID) currentlyPairedWith.add(pair.TeamA_ID);
        });

        const newSelections = new Set(selectedPartnerIDs);

        // Xử lý các cặp cần thêm mới
        for (const partnerID of newSelections) {
            if (!currentlyPairedWith.has(partnerID)) {
                const teamA = managingTeamID < partnerID ? managingTeamID : partnerID;
                const teamB = managingTeamID < partnerID ? partnerID : managingTeamID;
                const newPairID = `${teamA}-${teamB}`;
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
                    await deletePairingQuery.run({ rowIndexToDelete: pairObjectToDelete.rowIndex });
                }
            }
        }
        
        await getEvaluationPairs.run();
        showAlert('Đã cập nhật lựa chọn!', 'success');
    }
}
