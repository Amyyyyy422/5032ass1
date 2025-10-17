<script setup>
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Select from 'primevue/select'
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { FilterMatchMode } from '@primevue/core/api'
import Button from 'primevue/button'
import emailjs from '@emailjs/browser'

const selectedUserType = ref('all')
const userType = ref([
  { label: 'All users', value: 'all' },
  { label: 'Normal Users', value: 'user' },
  { label: 'Admin', value: 'admin' }
])

const user = ref([
  { id: 1, name: 'Amy', email: '646323156@qq.com', role: 'user', status: 'active' },
  { id: 2, name: 'Admin', email: 'amyren123456@gmail.com', role: 'admin', status: 'active' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user', status: 'inactive' },
  { id: 4, name: 'Doris', email: 'doris@example.com', role: 'advanced', status: 'active' },
  { id: 5, name: 'Evan', email: 'evan@example.com', role: 'user', status: 'active' },
  { id: 6, name: 'Fiona', email: 'fiona@example.com', role: 'advanced', status: 'inactive' },
  { id: 7, name: 'Grace', email: 'grace@example.com', role: 'user', status: 'active' },
  { id: 8, name: 'Henry', email: 'henry@example.com', role: 'advanced', status: 'active' },
  { id: 9, name: 'Ivy', email: 'ivy@example.com', role: 'user', status: 'inactive' },
  { id: 10, name: 'Jack', email: 'jack@example.com', role: 'advanced', status: 'active' },
  { id: 11, name: 'Kate', email: 'kate@example.com', role: 'user', status: 'active' },
  { id: 12, name: 'Leo', email: 'leo@example.com', role: 'advanced', status: 'inactive' },
  { id: 13, name: 'Mia', email: 'mia@example.com', role: 'user', status: 'active' },
  { id: 14, name: 'Noah', email: 'noah@example.com', role: 'advanced', status: 'active' },
  { id: 15, name: 'Olivia', email: 'olivia@example.com', role: 'user', status: 'inactive' },
  { id: 16, name: 'Paul', email: 'paul@example.com', role: 'advanced', status: 'active' },
  { id: 17, name: 'Quinn', email: 'quinn@example.com', role: 'user', status: 'active' },
  { id: 18, name: 'Ryan', email: 'ryan@example.com', role: 'advanced', status: 'inactive' },
  { id: 19, name: 'Sophia', email: 'sophia@example.com', role: 'user', status: 'active' },
  { id: 20, name: 'Tom', email: 'tom@example.com', role: 'advanced', status: 'active' },
  { id: 21, name: 'Una', email: 'una@example.com', role: 'user', status: 'inactive' }
])

const filters = ref({
  name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  email: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const selectedRows = ref([])

const exportColumns = [
  { header: 'Name', field: 'name' },
  { header: 'Email', field: 'email' },
  { header: 'Role', field: 'role' },
  { header: 'Status', field: 'status' }
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

  for (const user of selectedRows.value) {
    try {
      await emailjs.send(
        'service_4zpap0t',
        'template_8ptenqh',
        {
          to_email: user.email,
          name: user.name,
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
}

</script>

<template>
  <h1>Admin Panel</h1>
  <Tabs>
    <TabList>
      <Tab value="0">User Management</Tab>
      <Tab value="1">Analytics</Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="0">
        <Select
          id="userType"
          :options="userType"
          option-label="label"
          :option-value="value"
          placeholder="Select User Type"
          v-model="selectedUserType"
        ></Select>
        <DataTable
          :value="user"
          tableStyle="min-width: 50rem" 
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          v-model:filters="filters"
          filterDisplay="row"
          v-model:selection="selectedRows"
        >
          <Column selection-mode="multiple" headerStyle="width: 3rem"></Column>
          <Column field="id" header="ID"></Column>
          <Column field="name" header="Name" sortable>
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                type="text"
                @input="filterCallback()"
                placeholder="Search by name"
              />
            </template>
          </Column>
          <Column field="email" header="Email" sortable>
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                type="text"
                @input="filterCallback()"
                placeholder="Search by email"
              />
            </template>
          </Column>
          <Column field="role" header="Role"></Column>
          <Column field="status" header="Status"></Column>
        </DataTable>
        <Button @click="onExportSelected" :disabled="selectedRows.length === 0">Export CSV</Button>
        <Button @click="bulkSend" :disabled="selectedRows.length === 0">Send Email</Button>
      </TabPanel>
      <TabPanel value="1">User Chart</TabPanel>
    </TabPanels>
  </Tabs>
</template>

<style scoped>
</style>