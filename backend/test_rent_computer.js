const BASE_URL = 'http://localhost:3000/api/rent-computer';

async function testRentComputer() {
    console.log('🚀 Starting Rent Computer API Tests...');

    // 1. Create a Rental
    console.log('\nTesting Create Rental...');
    let rentalId;
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                member_no: '001',
                member_name: 'Test User',
                pc_number: 1,
                notes: 'Test rental'
            })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Create Rental Passed:', data.data);
            rentalId = data.data.id;
        } else {
            console.error('❌ Create Rental Failed:', data);
        }
    } catch (error) {
        console.error('❌ Create Rental Error:', error.message);
    }

    // 2. Get Active Rentals
    console.log('\nTesting Get Active Rentals...');
    try {
        const response = await fetch(`${BASE_URL}/active`);
        const data = await response.json();
        if (data.success) {
            console.log(`✅ Get Active Rentals Passed. Found ${data.data.length} active rentals.`);
            const myRental = data.data.find(r => r.id === rentalId);
            if(myRental) console.log('   -> Found our newly created rental in the list.');
        } else {
            console.error('❌ Get Active Rentals Failed:', data);
        }
    } catch (error) {
        console.error('❌ Get Active Rentals Error:', error.message);
    }

    // 3. Complete Rental
    if (rentalId) {
        console.log(`\nTesting Complete Rental (ID: ${rentalId})...`);
        try {
            const response = await fetch(`${BASE_URL}/${rentalId}/complete`, {
                method: 'PUT'
            });
            const data = await response.json();
            if (data.success) {
                console.log('✅ Complete Rental Passed');
            } else {
                console.error('❌ Complete Rental Failed:', data);
            }
        } catch (error) {
            console.error('❌ Complete Rental Error:', error.message);
        }
    } else {
        console.log('\nSkipping Complete Rental Test (No Rental ID)');
    }
}

testRentComputer();
