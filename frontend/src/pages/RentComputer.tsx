import React, { useState, useEffect, useRef } from 'react';
import { Search, Monitor, User, RotateCcw, History, FileSpreadsheet, PlayCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config/api.config';

interface Member {
    MemberNo: string;
    Fullname: string;
    DateOfBirth: string;
    PlaceOfBirth: string;
    JenisAnggota: string;
    Pendidikan: string;
    Pekerjaan: string;
}

interface Rental {
    id: number;
    pc_number: number;
    member_name: string;
    member_type?: string;
    education?: string;
    job?: string;
    notes: string;
    duration: number; // in minutes
    start_time: string;
    end_time?: string;
    status: 'active' | 'completed';
    // Additional Member Fields
    MemberNo?: string;
    JenisIdentitas?: string;
    IdentityNo?: string;
    Fullname?: string;
    PlaceOfBirth?: string;
    DateOfBirth?: string;
    JenisKelamin?: string;
    Pendidikan?: string;
    Pekerjaan?: string;
    NoHp?: string;
    Email?: string;
    Address?: string;
    JenisAnggota?: string;
    StatusAnggota?: string;
}

const RentComputer = () => {
    const [activeTab, setActiveTab] = useState<'rental' | 'history'>('rental');
    const [memberNo, setMemberNo] = useState('');
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(false);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [history, setHistory] = useState<Rental[]>([]);
    const [selectedPC, setSelectedPC] = useState<number | null>(null);
    const [notes, setNotes] = useState('');
    const [processedAutoStop, setProcessedAutoStop] = useState<Set<number>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);

    // Available PCs (1-12)
    const pcs = Array.from({ length: 12 }, (_, i) => i + 1);

    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const fetchMember = async (queryNo: string) => {
        if (!queryNo) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/members/${queryNo}`);
            const data = await response.json();
            
            if (data.success) {
                setMember(data.data);
            } else {
                setMember(null);
                alert("Member Not Found: Please check the member number.");
            }
        } catch (error) {
            console.error("Error fetching member", error);
            setMember(null);
            alert("Error: Failed to fetch member data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveRentals = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/rent-computer/active`);
            const data = await response.json();
            if (data.success) {
                setRentals(data.data);
            }
        } catch (error) {
            console.error("Error fetching rentals", error);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/rent-computer/history`);
            const data = await response.json();
            if (data.success) {
                setHistory(data.data);
            }
        } catch (error) {
            console.error("Error fetching history", error);
        }
    };

    // Timer Logic
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTimeLeft = (startTime: string, durationMinutes: number) => {
        const start = new Date(startTime).getTime();
        const end = start + (durationMinutes * 60 * 1000);
        const diff = end - now.getTime();

        if (diff <= 0) return { text: "Overdue", isOverdue: true };

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { 
            text: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, 
            isOverdue: false 
        };
    };

    const autoStopRental = async (rentalId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/rent-computer/${rentalId}/complete`, {
                method: 'PUT'
            });
            const data = await response.json();
            if (data.success) {
                console.log(`Auto-stopped rental ${rentalId}`);
                fetchActiveRentals();
            }
        } catch (error) {
            console.error("Error auto-stopping rental", error);
        }
    };

    // Auto-stop check
    useEffect(() => {
        rentals.forEach(rental => {
            if (rental.status === 'active' && !processedAutoStop.has(rental.id)) {
                const { isOverdue } = formatTimeLeft(rental.start_time, rental.duration || 120);
                if (isOverdue) {
                    setProcessedAutoStop(prev => new Set(prev).add(rental.id));
                    autoStopRental(rental.id);
                }
            }
        });
    }, [now, rentals]);

    const handleExtend = async (rentalId: number, minutes: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/rent-computer/${rentalId}/extend`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minutes })
            });
            const data = await response.json();
            if (data.success) {
                fetchActiveRentals(); // Refresh to get new duration
                alert(`Extended by ${minutes} minutes`);
            } else {
                alert(data.message || "Failed to extend");
            }
        } catch (error) {
            alert("Error extending rental");
        }
    };

    useEffect(() => {
        if (activeTab === 'rental') {
            fetchActiveRentals();
             if (inputRef.current) {
                inputRef.current.focus();
            }
        } else {
            fetchHistory();
        }
    }, [activeTab]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            fetchMember(memberNo);
        }
    };

    const handleRent = async () => {
        if (!member || !selectedPC) return;

        try {
            const response = await fetch(`${API_BASE_URL}/rent-computer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    member_no: member.MemberNo,
                    member_name: member.Fullname,
                    member_type: member.JenisAnggota,
                    education: member.Pendidikan,
                    job: member.Pekerjaan,
                    pc_number: selectedPC,
                    notes: notes
                }),
            });
            const data = await response.json();

            if (data.success) {
                alert(`Rental Started: PC ${selectedPC} assigned to ${member.Fullname}`);
                fetchActiveRentals();
                resetForm();
            } else {
                 alert(data.message || "Something went wrong");
            }
        } catch (error: any) {
             alert(error.message || "Something went wrong");
        }
    };

    const handleComplete = async (rentalId: number) => {
        if(!confirm("Are you sure you want to stop this rental?")) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/rent-computer/${rentalId}/complete`, {
                method: 'PUT'
            });
            const data = await response.json();
            if (data.success) {
                fetchActiveRentals();
            }
        } catch (error) {
           alert("Error: Failed to complete rental.");
        }
    }

    const resetForm = () => {
        setMember(null);
        setMemberNo('');
        setSelectedPC(null);
        setNotes('');
        if (inputRef.current) inputRef.current.focus();
    };

    const getPCStatus = (pcNum: number) => {
        const rental = rentals.find(r => r.pc_number === pcNum);
        return rental ? { status: 'occupied', rental } : { status: 'available' };
    };

    const exportToExcel = () => {
        const worksheetData = [
            ['Rent Computer History'],
            ['Generated At', new Date().toLocaleString()],
            [''],
            [
                'Date', 'Time', 'Member No', 'Full Name', 'Identity Type', 'Identity No', 
                'Place of Birth', 'Date of Birth', 'Gender', 'Education', 'Job', 
                'Phone', 'Email', 'Address', 'Member Type', 'Member Status',
                'PC Number', 'Status', 'Start Time', 'End Time', 'Notes'
            ]
        ];

        history.forEach(item => {
            worksheetData.push([
                new Date(item.start_time).toLocaleDateString(),
                new Date(item.start_time).toLocaleTimeString(),
                item.MemberNo || '-',
                item.Fullname || item.member_name || '-',
                item.JenisIdentitas || '-',
                item.IdentityNo || '-',
                item.PlaceOfBirth || '-',
                item.DateOfBirth ? new Date(item.DateOfBirth).toLocaleDateString() : '-',
                item.JenisKelamin || '-',
                item.Pendidikan || '-',
                item.Pekerjaan || '-',
                item.NoHp || '-',
                item.Email || '-',
                item.Address || '-',
                item.JenisAnggota || '-',
                item.StatusAnggota || '-',
                `PC ${item.pc_number}`,
                item.status,
                new Date(item.start_time).toLocaleString(),
                item.end_time ? new Date(item.end_time).toLocaleString() : '-',
                item.notes || '-'
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(wb, ws, 'History');
        XLSX.writeFile(wb, `Rent_Computer_History_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="p-8 space-y-8 text-white min-h-screen pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Rent Computer
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('rental')}
                        className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${activeTab === 'rental' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                        <PlayCircle className="w-4 h-4" />
                        Rental
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                        <History className="w-4 h-4" />
                        History
                    </button>
                </div>
            </div>

            {activeTab === 'rental' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Find Member Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-800/50 border border-slate-700 backdrop-blur-sm rounded-xl overflow-hidden">
                             <div className="flex justify-between items-center p-6 pb-2">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-400" />
                                    Find Member
                                </h2>
                                <button 
                                    onClick={resetForm} 
                                    className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                                >
                                    <RotateCcw className="h-3 w-3" /> Reset
                                </button>
                            </div>
                            <div className="p-6 pt-2 space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        placeholder="Scan or Enter Member No"
                                        value={memberNo}
                                        onChange={(e) => setMemberNo(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    />
                                    <button 
                                        onClick={() => fetchMember(memberNo)} 
                                        disabled={loading} 
                                        className="bg-blue-600 hover:bg-blue-700 px-4 rounded transition-colors flex items-center justify-center disabled:opacity-50"
                                    >
                                        <Search className="h-4 w-4" />
                                    </button>
                                </div>

                                {member && (
                                    <div className="p-4 bg-slate-900/50 rounded-lg space-y-3 border border-slate-700 animation-fade-in">
                                        <div>
                                            <label className="text-slate-400 text-xs block">Member No</label>
                                            <div className="font-mono text-lg text-blue-300">{member.MemberNo}</div>
                                        </div>
                                        <div>
                                            <label className="text-slate-400 text-xs block">Full Name</label>
                                            <div className="font-medium text-lg">{member.Fullname}</div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div>
                                                <label className="text-slate-400 text-xs block">Age</label>
                                                <div className="font-medium">{member.DateOfBirth ? calculateAge(member.DateOfBirth) : '-'} Years</div>
                                            </div>
                                             <div>
                                                <label className="text-slate-400 text-xs block">D.O.B</label>
                                                <div className="font-medium">{member.DateOfBirth ? new Date(member.DateOfBirth).toLocaleDateString() : '-'}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50">
                                            <div>
                                                <label className="text-slate-400 text-xs block">Type Member</label>
                                                <div className="font-medium text-sm truncate" title={member.JenisAnggota}>{member.JenisAnggota || '-'}</div>
                                            </div>
                                            <div>
                                                <label className="text-slate-400 text-xs block">Education</label>
                                                <div className="font-medium text-sm truncate" title={member.Pendidikan}>{member.Pendidikan || '-'}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-slate-400 text-xs block">Job</label>
                                                <div className="font-medium text-sm truncate" title={member.Pekerjaan}>{member.Pekerjaan || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                 {member && (
                                    <div className="space-y-4 pt-4 border-t border-slate-700">
                                        <div>
                                            <label className="text-slate-400 mb-2 block">Select PC</label>
                                            <div className="text-xl font-bold text-center p-3 bg-slate-900 rounded border border-slate-700 mb-2">
                                                {selectedPC ? `PC ${selectedPC}` : 'None Selected'}
                                            </div>
                                        </div>
                                        <button 
                                            className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-green-500/20 transition-all rounded ${(!selectedPC || !member) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={!selectedPC || !member}
                                            onClick={handleRent}
                                        >
                                            Start Rental
                                        </button>
                                        <input
                                            placeholder="Optional Notes"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-sm px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PC Grid Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-800/50 border border-slate-700 backdrop-blur-sm h-full rounded-xl overflow-hidden">
                             <div className="p-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                                    <Monitor className="h-5 w-5 text-cyan-400" />
                                    Computer Status (11 Units)
                                </h2>
                                
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {pcs.map((pcNum) => {
                                        const { status, rental } = getPCStatus(pcNum);
                                        const isOccupied = status === 'occupied';
                                        const isSelected = selectedPC === pcNum;
                                        
                                        let timerDisplay = null;
                                        if (isOccupied && rental) {
                                            const { text, isOverdue } = formatTimeLeft(rental.start_time, rental.duration || 120);
                                            timerDisplay = (
                                                <div className={`text-xl font-mono font-bold ${isOverdue ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                                                    {text}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={pcNum}
                                                // Removed disabled attribute from the container to allow Stop interaction
                                                onClick={() => !isOccupied && setSelectedPC(pcNum)}
                                                className={`
                                                    relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-between gap-2 h-40 w-full
                                                    ${isOccupied 
                                                        ? 'bg-red-900/20 border-red-500/50 opacity-100' // Removed opacity-90 to make it clear it's interactable
                                                        : isSelected 
                                                            ? 'bg-blue-600/20 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105 cursor-pointer'
                                                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800 cursor-pointer'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <Monitor className={`h-5 w-5 ${isOccupied ? 'text-red-400' : isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                                                    <span className={`text-lg font-bold ${isOccupied ? 'text-red-400' : isSelected ? 'text-blue-400' : 'text-slate-300'}`}>
                                                        PC {pcNum}
                                                    </span>
                                                </div>

                                                {isOccupied && rental ? (
                                                    <div className="text-left w-full space-y-1 flex-1 flex flex-col justify-end">
                                                        <div className="text-xs text-slate-300 truncate font-semibold" title={rental.member_name}>
                                                            {rental.member_name}
                                                        </div>
                                                        <div className="flex justify-center my-1">
                                                            {timerDisplay}
                                                        </div>
                                                        <div className="flex gap-1 mt-auto">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleExtend(rental.id, 30); }}
                                                                className="flex-1 h-6 text-[10px] bg-blue-900/50 hover:bg-blue-800 border border-blue-800 text-blue-200 rounded transition-colors z-10"
                                                                title="Add 30 mins"
                                                            >
                                                                +30m
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleExtend(rental.id, 60); }}
                                                                className="flex-1 h-6 text-[10px] bg-blue-900/50 hover:bg-blue-800 border border-blue-800 text-blue-200 rounded transition-colors z-10"
                                                                title="Add 1 hour"
                                                            >
                                                                +1h
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleComplete(rental.id); }}
                                                                className="flex-1 h-6 text-[10px] bg-red-900/50 hover:bg-red-800 border border-red-800 text-red-200 rounded transition-colors z-10"
                                                            >
                                                                Stop
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-500 font-mono mt-auto">AVAILABLE</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800/50 border border-slate-700 backdrop-blur-sm rounded-xl overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <History className="h-5 w-5 text-blue-400" />
                            Rental History
                        </h2>
                        <button
                            onClick={exportToExcel}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Export Excel
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-700/50 text-slate-300">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Member No</th>
                                    <th className="px-6 py-3">Member Name</th>
                                    <th className="px-6 py-3">PC</th>
                                    <th className="px-6 py-3">Start Time</th>
                                    <th className="px-6 py-3">End Time</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                            No rental history found
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((rental) => (
                                        <tr key={rental.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 text-slate-300">
                                                {new Date(rental.start_time).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-blue-300">
                                                {rental.MemberNo || '-'}
                                            </td>
                                            <td className="px-6 py-4 w-48">
                                                <div className="font-medium text-white">{rental.member_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-blue-400 font-bold">
                                                PC {rental.pc_number}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {new Date(rental.start_time).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {rental.end_time ? new Date(rental.end_time).toLocaleTimeString() : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${rental.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                    {rental.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm max-w-xs truncate">
                                                {rental.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RentComputer;
