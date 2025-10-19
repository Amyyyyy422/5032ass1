<template>
  <section class="container my-4" style="max-width: 1200px">
    <div class="text-center"><h1 class="mb-3">Admin Panel</h1></div>

    <TabView v-model:activeIndex="activeIndex">
      <TabPanel header="User Management">
        <div class="row g-3 align-items-end mb-3">
          <div class="col-md-3">
            <Select
              id="userType"
              :options="userType"
              option-label="label"
              option-value="value"
              placeholder="Select User Type"
              v-model="roleFilter"
            />
          </div>

          <div class="col-md-3">
            <InputText v-model.trim="nameQuery" class="w-100" placeholder="Search by name" />
          </div>

          <div class="col-md-3">
            <InputText v-model.trim="emailQuery" class="w-100" placeholder="Search by email" />
          </div>
        </div>

        <DataTable
          :value="viewRows"
          :loading="loading"
          dataKey="_id"
          class="p-datatable-sm"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10,20,50]"
          responsiveLayout="scroll"
          :sortField="sortField"
          :sortOrder="sortOrder"
          @sort="onSort"
          showGridlines
          v-model:selection="selectedRows"
          selectionMode="multiple"
        >
          <template #empty>No users found.</template>
          <template #loading>Loading users…</template>

          <Column selectionMode="multiple" headerStyle="width: 3rem" />

          <Column field="username" header="name" sortable />
          <Column field="email" header="email" sortable />
          <Column field="age" header="age" sortable>
            <template #body="{ data }">
              {{ showAge(data.age) }}
            </template>
          </Column>
          <Column field="gender" header="gender"/>
          <Column field="role" header="role"/>
        </DataTable>
        <Button @click="onExportSelected" :disabled="selectedRows.length === 0">Export CSV</Button>
        <Button @click="bulkSend" :disabled="selectedRows.length === 0">Send Email</Button>
      </TabPanel>

      <TabPanel header="Analytics">
        <div class="row g-4 pt-2">
          <div class="col-md-6">
            <h5 class="mb-2">Gender distribution</h5>
            <canvas id="genderChart" height="220"></canvas>
          </div>
          <div class="col-md-6">
            <h5 class="mb-2">Age buckets</h5>
            <canvas id="ageChart" height="220"></canvas>
          </div>
        </div>
        <p class="text-muted mt-3">Data source: Firestore collection <code>users</code>.</p>
      </TabPanel>
    </TabView>
  </section>
</template>

<script setup>
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import emailjs from '@emailjs/browser'
import Select from 'primevue/select'

import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { db } from '@/auth'
import { collection, onSnapshot } from 'firebase/firestore'

import Chart from 'chart.js/auto'

/* （0:User Management, 1:Analytics） */
const activeIndex = ref(0)

/* ===== Firestore users ===== */
const users = ref([])
const loading = ref(true)
let unsub = null

onMounted(() => {
  const col = collection(db, 'users')
  unsub = onSnapshot(
    col,
    (snap) => {
      users.value = snap.docs.map((d) => {
        const x = d.data() || {}
        return {
          _id: d.id,
          username: x.username || '',
          email: x.email || '',
          age: Number.isFinite(Number(x.age)) ? Number(x.age) : null,
          gender: (x.gender || '').toString(),
          role: x.role || 'user',
          createdAt: x.createdAt || null
        }
      })
      loading.value = false
    },
    (err) => {
      console.error('users onSnapshot error:', err)
      loading.value = false
    }
  )
})

onBeforeUnmount(() => unsub && unsub())

/* ===== User Management ===== */
const userType = ref([
  { label: 'All users', value: '' },
  { label: 'Normal Users', value: 'user' },
  { label: 'Admin', value: 'admin' }
])

const roleFilter = ref('')
const nameQuery = ref('')
const emailQuery = ref('')

const sortField = ref('username') // username/email/age/gender/role
const sortOrder = ref(1) // 1=asc, -1=desc
function onSort(e) {
  sortField.value = e.sortField
  sortOrder.value = e.sortOrder
}

const viewRows = computed(() => {
  const role = roleFilter.value.trim().toLowerCase()
  const nq = nameQuery.value.trim().toLowerCase()
  const eq = emailQuery.value.trim().toLowerCase()

  let arr = users.value.filter((u) => {
    const okRole = !role || (u.role || '').toLowerCase() === role
    const okName = !nq || (u.username || '').toLowerCase().includes(nq)
    const okEmail = !eq || (u.email || '').toLowerCase().includes(eq)
    return okRole && okName && okEmail
  })

  arr.sort((a, b) => {
    if (sortField.value === 'age') {
      const A = Number.isFinite(a.age) ? a.age : -Infinity
      const B = Number.isFinite(b.age) ? b.age : -Infinity
      return sortOrder.value === 1 ? A - B : B - A
    }
    const A = (a[sortField.value] ?? '').toString().toLowerCase()
    const B = (b[sortField.value] ?? '').toString().toLowerCase()
    if (A < B) return sortOrder.value === 1 ? -1 : 1
    if (A > B) return sortOrder.value === 1 ? 1 : -1
    return 0
  })

  return arr
})

/* ===== emailjs ===== */
const selectedRows = ref([])

const exportColumns = [
  { header: 'name', field: 'username' },
  { header: 'email', field: 'email' },
  { header: 'age', field: 'age' },
  { header: 'gender', field: 'gender' },
  { header: 'role', field: 'role' }
]

function toCSV(rows, columns) {
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    const needsQuote = /[",\n]/.test(s)
    const escaped = s.replace(/"/g, '""')
    return needsQuote ? `"${escaped}"` : escaped
  }

  const headerLine = columns.map((c) => esc(c.header)).join(',')
  const body = rows.map((r) => columns.map((c) => esc(r[c.field])).join(',')).join('\n')

  return '\uFEFF' + headerLine + '\n' + body 
}

function downloadCSV(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const onExportSelected = () => {
  if (!selectedRows.value.length) {
    alert('Please select at least one user to export.')
    return
  }
  const csv = toCSV(selectedRows.value, exportColumns)
  const filename = `users-selected-${new Date().toISOString().slice(0, 10)}.csv`
  downloadCSV(filename, csv)
}

const bulkSend = async () => {
  if (!selectedRows.value.length) {
    alert('Please select at least one user to send email.')
    return
  }

  // Add a confirmation box
  const confirmed = confirm(`Are you sure you want to send emails to ${selectedRows.value.length} user(s)?\n\nThis action cannot be undone.`)
  if (!confirmed) {
    return 
  }

  for (const user of selectedRows.value) {
    try {
      await emailjs.send(
        'service_4zpap0t',
        'template_lazg9ap',
        {
          to_email: user.email,
          name: user.username,
          email: 'test@test.com'
        },
        {
          publicKey: 'WgxFFSGsyHiCgwIcI'
        }
      )
    } catch (error) {
      console.log(error)
    }
  }
  
  alert(`Emails sent successfully to ${selectedRows.value.length} user(s)!`)
}

function normalizeGender(g) {
  const s = String(g || '').trim().toLowerCase();
  if (!s) return 'unknown';

  if (s === 'female' || s === 'f') return 'female';
  if (s === 'male'   || s === 'm') return 'male';
  if (s === 'other'  || s === 'o') return 'other';

  if (s.includes('female')) return 'female';
  if (s.includes('male'))   return 'male';
  if (s.includes('other'))  return 'other';
  if (s.includes('non'))    return 'non-binary';

  return s;
}
function showAge(a) {
  return Number.isFinite(a) ? a : '—'
}

/* ===== Analytics ===== */
let genderChart = null
let ageChart = null

function buildCharts() {
  // gender
  const gCount = { male: 0, female: 0, other: 0 }
  users.value.forEach((u) => {
    const g = normalizeGender(u.gender)
    if (g === 'male') gCount.male++
    else if (g === 'female') gCount.female++
    else gCount.other++
  })

  // age
  const buckets = { '12-15': 0, '16-18': 0, '19-22': 0, '23-25': 0, '25+': 0 }
  users.value.forEach((u) => {
    const a = Number(u.age)
    if (!Number.isFinite(a)) {
      buckets.other++
      return
    }
    if (a >= 12 && a <= 15) buckets['12-15']++
    else if (a <= 18) buckets['16-18']++
    else if (a <= 22) buckets['19-22']++
    else if (a <= 25) buckets['23-25']++
    else buckets['25+']++
  })

  if (genderChart) genderChart.destroy()
  if (ageChart) ageChart.destroy()

  // gender pie chart
  const gEl = document.getElementById('genderChart')
  if (gEl) {
    genderChart = new Chart(gEl, {
      type: 'pie',
      data: {
        labels: Object.keys(gCount),
        datasets: [{ data: Object.values(gCount) }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    })
  }

  // age bar chart
  const aEl = document.getElementById('ageChart')
  if (aEl) {
    ageChart = new Chart(aEl, {
      type: 'bar',
      data: {
        labels: Object.keys(buckets),
        datasets: [{ label: 'Users', data: Object.values(buckets) }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: { legend: { display: false } }
      }
    })
  }
}


watch(users, async () => {
  if (activeIndex.value === 1) {
    await nextTick()
    buildCharts()
  }
})
watch(activeIndex, async (i) => {
  if (i === 1) {
    await nextTick()
    buildCharts()
  }
})
</script>

<style scoped>
.container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}


:deep(*) {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
}

.text-capitalize { 
  text-transform: capitalize; 
}
</style>
