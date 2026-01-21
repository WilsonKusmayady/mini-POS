<?php

namespace App\Http\Controllers;

use App\Services\MemberService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Log;

class MemberController extends Controller
{
    protected $memberService;

    public function __construct(MemberService $memberService)
    {
        $this->memberService = $memberService;
    }

    /**
     * Display members index page
     */
    public function index()
    {
        return Inertia::render('members/index');
    }

    /**
     * API: Get paginated members
     */
    public function apiIndex(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|in:10,25,50,100',
            'search' => 'nullable|string|max:255',
            'gender' => 'nullable|in:0,1',
            'status' => 'nullable|in:active,inactive',
            'birth_date_start' => 'nullable|date',
            'birth_date_end' => 'nullable|date|after_or_equal:birth_date_start',    
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $filters = $request->only(['search', 'gender', 'status', 'birth_date_start', 'birth_date_end']);
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);
            
            $members = $this->memberService->getPaginatedMembers($filters, $perPage, $page);
            
            return response()->json($members);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch members: ' . $e->getMessage()
            ], 500);
        }
    }

    public function apiStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20|unique:members,phone_number',
            'address' => 'required|string',
            'gender' => 'required|in:0,1',
            'birth_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $member = $this->memberService->createMember($request->all());
            
            return response()->json([
                'success' => true,
                'member' => $member,
                'message' => 'Member berhasil dibuat'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat member: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Show create member form
     */
    public function create()
    {
        return Inertia::render('members/create');
    }

    /**
     * Store new member
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address' => 'required|string',
            'gender' => 'required|boolean',
            'birth_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $member = $this->memberService->createMember($request->all());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'member' => $member,
                    'message' => 'Member berhasil dibuat',
                ]);
            }

            // ✅ RESPONSE UNTUK FORM BIASA
            return redirect()
                ->route('members.index')
                ->with('success', 'Member berhasil ditambahkan');
                
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menambahkan member: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Show member details
     */
    public function show(string $memberCode)
    {
        try {
            $member = $this->memberService->getMemberWithDetails($memberCode);
            
            return Inertia::render('members/show', [
                'member' => $member,
            ]);
            
        } catch (\Exception $e) {
            return redirect()->route('members.index')
                ->with('error', 'Member tidak ditemukan: ' . $e->getMessage());
        }
    }

    /**
     * Show edit member form
     */
    public function edit(string $memberCode)
    {
        try {
            $member = $this->memberService->getMember($memberCode);
            
            return Inertia::render('members/edit', [
                'member' => $member,
            ]);
            
        } catch (\Exception $e) {
            return redirect()->route('members.index')
                ->with('error', 'Member tidak ditemukan: ' . $e->getMessage());
        }
    }

    /**
     * Update member
     */
    public function update(Request $request, string $memberCode)
    {
        $validator = Validator::make($request->all(), [
            'member_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address' => 'required|string',
            'gender' => 'required|boolean',
            'birth_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $this->memberService->updateMember($memberCode, $request->all());
            
            return redirect()
                ->route('members.index')
                ->with('success', 'Member berhasil diperbarui');
                
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui member: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Delete member
     */
    public function destroy(string $memberCode)
    {
        try {
            $this->memberService->deleteMember($memberCode);
            
            return response()->json([
                'success' => true,
                'message' => 'Member berhasil dihapus'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus member: ' . $e->getMessage()
            ], 500);
        }
    }

    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $search = $request->input('search', '');
            $perPage = $request->input('per_page', 20);
            $page = $request->input('page', 1);
            
            \Log::info('Searching members', [
                'search' => $search,
                'perPage' => $perPage,
                'page' => $page
            ]);
            
            // Panggil service dengan parameter yang benar
            $members = $this->memberService->searchMembers($search, $perPage, $page);
            
            \Log::info('Found members', ['count' => $members->count()]);
            
            // Format response
            return response()->json([
                'data' => $members->items(),
                'current_page' => $members->currentPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total(),
                'last_page' => $members->lastPage(),
                'next_page_url' => $members->nextPageUrl(),
                'prev_page_url' => $members->previousPageUrl(),
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error in members search: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to search members: ' . $e->getMessage()
            ], 500);
        }
    }

    public function apiUpdate(Request $request, string $memberCode)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:active,inactive',
            'member_name' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:20|unique:members,phone_number,' . $memberCode . ',member_code',
            'address' => 'nullable|string',
            'gender' => 'nullable|in:0,1',
            'birth_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Update semua data sekaligus
            $this->memberService->updateMember($memberCode, $request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Member berhasil diperbarui'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui member: ' . $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        Log::info('Member export called', [
            'filters' => $request->all(),
            'url' => $request->fullUrl(),
            'user' => auth()->user()->id ?? 'guest',
            'headers' => $request->headers->all(),
            'expectsJson' => $request->expectsJson(),
            'wantsJson' => $request->wantsJson(),
            'ajax' => $request->ajax(),
            'inertia' => $request->header('X-Inertia') ? 'true' : 'false'
        ]);

        // Validate query parameters
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'gender' => 'nullable|in:0,1',
            'status' => 'nullable|in:active,inactive',
            'birth_date_start' => 'nullable|date',
            'birth_date_end' => 'nullable|date|after_or_equal:birth_date_start',
        ]);

        if ($validator->fails()) {
            // Untuk AJAX/JSON request, return JSON error
            if ($request->expectsJson() || $request->ajax() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            // Untuk Inertia request, redirect dengan error
            return redirect()->route('members.index')
                ->withErrors($validator)
                ->withInput();
        }

        $filters = $request->only(['search', 'gender', 'status', 'birth_date_start', 'birth_date_end']);
        
        Log::info('Processing export with filters', ['filters' => $filters]);

        try {
            $exportData = $this->memberService->getExportData($filters);
            
            Log::info('Export data retrieved', ['count' => count($exportData)]);

            // Jika tidak ada data
            if (empty($exportData)) {
                if ($request->expectsJson() || $request->ajax() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                    return response()->json(['error' => 'Tidak ada data untuk diexport'], 404);
                }
                return redirect()->route('members.index')
                    ->with('error', 'Tidak ada data untuk diexport');
            }

            // Generate CSV content
            $csvContent = $this->generateCSV($exportData, $filters);
            
            $filename = 'members_export_' . date('Y-m-d_His') . '.csv';

            Log::info('CSV generated', [
                'filename' => $filename,
                'content_length' => strlen($csvContent),
                'data_count' => count($exportData)
            ]);
            
            // KUNCI: Explicitly return CSV response dengan headers yang benar
            $headers = [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
                'Content-Length' => strlen($csvContent),
                // Header penting untuk mencegah Inertia intercept
                'X-Inertia' => 'false',
                'X-Inertia-Location' => 'false',
            ];
            
            return response($csvContent, 200, $headers);
            
        } catch (\Throwable $e) {
            Log::error('Export failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            // Handle error berdasarkan request type
            if ($request->expectsJson() || $request->ajax() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['error' => 'Gagal export data: ' . $e->getMessage()], 500);
            }
            
            return redirect()->route('members.index')
                ->with('error', 'Gagal export data: ' . $e->getMessage());
        }
    }

    /**
     * API Export for AJAX requests
     */
    public function apiExport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'gender' => 'nullable|in:0,1',
            'status' => 'nullable|in:active,inactive',
            'birth_date_start' => 'nullable|date',
            'birth_date_end' => 'nullable|date|after_or_equal:birth_date_start',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $filters = $request->only(['search', 'gender', 'status', 'birth_date_start', 'birth_date_end']);
            $exportData = $this->memberService->getExportData($filters);
            
            // Generate CSV content
            $csvContent = $this->generateCSV($exportData, $filters);
            
            $filename = 'members_export_' . date('Y-m-d_His') . '.csv';
            
            return response()->json([
                'success' => true,
                'data' => base64_encode($csvContent),
                'filename' => $filename
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to export members: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate CSV content
     */
    private function generateCSV(array $data, array $filters = []): string
    {
        $output = fopen('php://temp', 'r+');
        
        // Header dengan informasi filter
        fputcsv($output, ['LAPORAN DATA MEMBER']);
        fputcsv($output, ['Tanggal Export', date('d/m/Y H:i:s')]);
        
        // Informasi filter
        if (!empty($filters)) {
            fputcsv($output, ['']);
            fputcsv($output, ['FILTER YANG DIGUNAKAN:']);
            
            if (!empty($filters['search'])) {
                fputcsv($output, ['Pencarian', $filters['search']]);
            }
            
            if (isset($filters['gender'])) {
                $genderText = $filters['gender'] == 1 ? 'Laki-laki' : 'Perempuan';
                fputcsv($output, ['Jenis Kelamin', $genderText]);
            }
            
            if (isset($filters['status'])) {
                $statusText = $filters['status'] == 'active' ? 'Aktif' : 'Nonaktif';
                fputcsv($output, ['Status', $statusText]);
            }
            
            if (!empty($filters['birth_date_start']) && !empty($filters['birth_date_end'])) {
                fputcsv($output, ['Tanggal Lahir', $filters['birth_date_start'] . ' - ' . $filters['birth_date_end']]);
            } elseif (!empty($filters['birth_date_start'])) {
                fputcsv($output, ['Tanggal Lahir (Dari)', $filters['birth_date_start']]);
            } elseif (!empty($filters['birth_date_end'])) {
                fputcsv($output, ['Tanggal Lahir (Sampai)', $filters['birth_date_end']]);
            }
        }
        
        fputcsv($output, ['']);
        fputcsv($output, ['']);
        
        // Header data utama
        $headers = [
            'No.',
            'Kode Member',
            'Nama Lengkap',
            'No. Telepon',
            'Alamat',
            'Jenis Kelamin',
            'Tanggal Lahir',
            'Usia',
            'Status',
            'Tanggal Daftar',
            // 'Waktu Daftar',
            'Terakhir Diperbarui'
        ];
        
        fputcsv($output, $headers);
        
        // Data rows
        $rowNumber = 1;
        foreach ($data as $member) {
            $row = [
                $rowNumber++,
                $member['member_code'],
                $member['member_name'],
                $member['phone_number'],
                $member['address'],
                $member['gender'],
                $member['birth_date'],
                $member['age'],
                $member['status'],
                $member['created_date'],
                // $member['created_time'],
                $member['updated_at']
            ];
            
            fputcsv($output, $row);
        }
        
        // Tambah summary
        fputcsv($output, ['']);
        fputcsv($output, ['SUMMARY']);
        fputcsv($output, ['Total Member', count($data)]);
        
        $activeMembers = count(array_filter($data, function($member) {
            return $member['status'] === 'Aktif';
        }));
        
        $maleMembers = count(array_filter($data, function($member) {
            return $member['gender'] === 'Laki-laki';
        }));
        
        $femaleMembers = count(array_filter($data, function($member) {
            return $member['gender'] === 'Perempuan';
        }));
        
        $averageAge = count($data) > 0 ? 
            round(array_sum(array_column($data, 'age')) / count($data), 1) : 0;
        
        fputcsv($output, ['Member Aktif', $activeMembers]);
        fputcsv($output, ['Member Laki-laki', $maleMembers]);
        fputcsv($output, ['Member Perempuan', $femaleMembers]);
        fputcsv($output, ['Rata-rata Usia', $averageAge . ' tahun']);
        
        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);
        
        return $csvContent;
    }
}