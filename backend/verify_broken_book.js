const brokenBookService = require('./src/services/brokenBookService');
const { dbApp } = require('./src/config/database');

async function test() {
    // const barcode = 'INLIS00000000000001'; 
    const { dbInlislite } = require('./src/config/database');
    const [rows] = await dbInlislite.query('SELECT collections.NomorBarcode FROM collections LIMIT 1');
    if (rows.length === 0) {
        console.error('No books found in catalog/collections to test with.');
        process.exit(1);
    }
    const barcode = rows[0].NomorBarcode;
    console.log(`Testing with barcode: ${barcode}`);

    try {
        // Clean up any existing broken book with this barcode
         await dbApp.query('DELETE FROM broken_books WHERE barcode = ?', [barcode]);

        const result = await brokenBookService.reportBrokenBook({
            barcode: barcode,
            title: 'Test Book',
            author: 'Test Author',
            damageType: 'torn_pages',
            damageDescription: 'Test damage',
            reportedBy: 'Tester',
            notes: 'Verification test'
        });

        console.log('Report result:', result);

        if (result.typeProcurement && result.source) {
            console.log('SUCCESS: Type_Procurement and Source were populated!');
            console.log('Type_Procurement:', result.typeProcurement);
            console.log('Source:', result.source);
        } else {
            console.log('FAILURE: Type_Procurement or Source missing.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

test();
