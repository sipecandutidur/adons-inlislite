const { dbInlislite } = require('../config/database');

const getAllMembers = async (page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;

        // Get total count
        const [countResult] = await dbInlislite.query(
            'SELECT COUNT(*) as total FROM members'
        );
        const total = countResult[0].total;

        // Get paginated data with joins
        const query = `
            SELECT 
                m.MemberNo, 
                mi.Nama AS JenisIdentitas, 
                m.IdentityNo, 
                m.Fullname, 
                m.PlaceOfBirth, 
                m.DateOfBirth,
                jk.Name AS JenisKelamin, 
                mp.Nama AS Pendidikan, 
                mj.Pekerjaan, 
                m.NoHp, 
                m.Email, 
                m.Address, 
                ja.jenisanggota AS JenisAnggota, 
                sa.Nama AS StatusAnggota, 
                m.LoanReturnLateCount 
            FROM members m
            INNER JOIN master_jenis_identitas mi ON m.IdentityType_id = mi.id
            INNER JOIN jenis_kelamin jk ON m.Sex_id = jk.ID
            INNER JOIN master_pendidikan mp ON m.EducationLevel_id = mp.id
            INNER JOIN master_pekerjaan mj ON m.Job_id = mj.id
            INNER JOIN jenis_anggota ja ON m.JenisAnggota_id = ja.id
            INNER JOIN status_anggota sa ON m.StatusAnggota_id = sa.id
            LIMIT ? OFFSET ?
        `;

        const [rows] = await dbInlislite.query(query, [parseInt(limit), parseInt(offset)]);

        return {
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error fetching members:', error);
        throw error;
    }

    
};

const getMemberById = async (noMember) => {
    try {
        const [rows] = await dbInlislite.query(
            `SELECT 
                m.MemberNo, 
                mi.Nama AS JenisIdentitas, 
                m.IdentityNo, 
                m.Fullname, 
                m.PlaceOfBirth, 
                m.DateOfBirth,
                jk.Name AS JenisKelamin, 
                mp.Nama AS Pendidikan, 
                mj.Pekerjaan, 
                m.NoHp, 
                m.Email, 
                m.Address, 
                ja.jenisanggota AS JenisAnggota, 
                sa.Nama AS StatusAnggota, 
                m.LoanReturnLateCount 
            FROM members m
            INNER JOIN master_jenis_identitas mi ON m.IdentityType_id = mi.id
            INNER JOIN jenis_kelamin jk ON m.Sex_id = jk.ID
            INNER JOIN master_pendidikan mp ON m.EducationLevel_id = mp.id
            INNER JOIN master_pekerjaan mj ON m.Job_id = mj.id
            INNER JOIN jenis_anggota ja ON m.JenisAnggota_id = ja.id
            INNER JOIN status_anggota sa ON m.StatusAnggota_id = sa.id WHERE MemberNo = ?`,
            [noMember]
        );

        if (rows.length === 0) {
            return {
                success: false,
                message: 'Member not found'
            };
        }

        return {
            success: true,
            data: rows[0]
        };
    } catch (error) {
        throw new Error(`Failed to fetch member: ${error.message}`);
    }
}

const getMembersByNos = async (memberNos) => {
    if (!memberNos || memberNos.length === 0) {
        return [];
    }

    try {
        const query = `
            SELECT 
                m.MemberNo, 
                mi.Nama AS JenisIdentitas, 
                m.IdentityNo, 
                m.Fullname, 
                m.PlaceOfBirth, 
                m.DateOfBirth,
                jk.Name AS JenisKelamin, 
                mp.Nama AS Pendidikan, 
                mj.Pekerjaan, 
                m.NoHp, 
                m.Email, 
                m.Address, 
                ja.jenisanggota AS JenisAnggota, 
                sa.Nama AS StatusAnggota, 
                m.LoanReturnLateCount 
            FROM members m
            INNER JOIN master_jenis_identitas mi ON m.IdentityType_id = mi.id
            INNER JOIN jenis_kelamin jk ON m.Sex_id = jk.ID
            INNER JOIN master_pendidikan mp ON m.EducationLevel_id = mp.id
            INNER JOIN master_pekerjaan mj ON m.Job_id = mj.id
            INNER JOIN jenis_anggota ja ON m.JenisAnggota_id = ja.id
            INNER JOIN status_anggota sa ON m.StatusAnggota_id = sa.id
            WHERE m.MemberNo IN (?)
        `;

        const [rows] = await dbInlislite.query(query, [memberNos]);
        return rows;
    } catch (error) {
        console.error('Error fetching members by numbers:', error);
        throw error;
    }
};

module.exports = {
    getAllMembers,
    getMemberById,
    getMembersByNos
};