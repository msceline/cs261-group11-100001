# คู่มือการรันโปรเจกต์ (สำหรับผู้เริ่มต้น)

โปรเจกต์ประกอบด้วย 3 ส่วน ซึ่งรันเป็น Docker container ทั้งหมด:

| ส่วน | เทคโนโลยี | พอร์ต (เครื่องเรา) |
| --- | --- | --- |
| `frontend` | Express.js (Node 22) | http://localhost:3000 |
| `backend` | Java 21 + Spring Boot | http://localhost:8080 |
| `db` | Microsoft SQL Server 2022 | `localhost:1433` |

## 1. สิ่งที่ต้องติดตั้งก่อน

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (เปิดโปรแกรมให้ขึ้นสถานะ *Running* ก่อนใช้งาน)
- [Git](https://git-scm.com/)

ไม่ต้องติดตั้ง Java, Maven หรือ Node.js ในเครื่อง เพราะ Docker จัดการให้

## 2. ดาวน์โหลดโปรเจกต์

```bash
git clone <URL ของ repository นี้>
cd TU-WorkSpace-Group11-CS261-1-26
```

## 3. สร้างไฟล์ `.env`

คัดลอกไฟล์ตัวอย่างแล้วแก้ค่าตามต้องการ

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

ค่าสำคัญใน `.env`:

- `MSSQL_SA_PASSWORD` – รหัสผ่านผู้ใช้ `sa` ของ SQL Server ต้องยาวอย่างน้อย 8 ตัว และมีตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และสัญลักษณ์ ไม่เช่นนั้น SQL Server จะไม่ยอมเริ่มทำงาน
- `DB_PORT`, `BACKEND_PORT`, `FRONTEND_PORT` – ถ้าพอร์ตชนกับโปรแกรมอื่นในเครื่อง ให้เปลี่ยนเลขตรงนี้

> ไฟล์ `.env` ถูกใส่ใน `.gitignore` แล้ว **ห้าม commit** เพราะมีรหัสผ่าน

## 4. รันทั้งระบบ

```bash
docker compose up --build
```

ครั้งแรกจะใช้เวลาหลายนาที (ดาวน์โหลด image และ build) รอจนเห็น log ว่า `Started ProjectApplication` แล้วเปิด:

- Frontend: http://localhost:3000
- Backend: http://localhost:8080

ถ้าต้องการรันเบื้องหลัง ให้เติม `-d`: `docker compose up --build -d`

## 5. คำสั่งที่ใช้บ่อย

| ต้องการ | คำสั่ง |
| --- | --- |
| ดูสถานะ container | `docker compose ps` |
| ดู log ทั้งหมด / เฉพาะ backend | `docker compose logs -f` / `docker compose logs -f backend` |
| หยุดระบบ (ข้อมูล DB ยังอยู่) | `docker compose down` |
| หยุดและ **ลบข้อมูล DB ทั้งหมด** | `docker compose down -v` |
| build ใหม่หลังแก้โค้ด | `docker compose up --build` |
| build ใหม่เฉพาะ backend | `docker compose up --build -d backend` |
| เข้า SQL Server ผ่าน terminal | `docker compose exec db /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa` |

ต่อ SQL Server จากโปรแกรมภายนอก (Azure Data Studio, DBeaver ฯลฯ): Host `localhost`, Port `1433`, User `sa`, Password ตามที่ตั้งใน `.env`, เลือก *Trust server certificate*

## 6. โครงสร้างโปรเจกต์

```
.
├── backend/
│   ├── DockerContainer_WebServer.dockerfile   # Dockerfile ของทั้ง frontend และ backend (multi-stage)
│   ├── pom.xml
│   └── src/                                   # โค้ด Spring Boot
├── frontend/
│   ├── server.js                              # Express: เสิร์ฟ index.html และส่งต่อ /api/* ไป backend
│   ├── package.json
│   └── index.html
├── docker-compose.yml                         # db + backend + frontend
├── .env.example                               # ตัวอย่างค่าตั้งต้น
└── SETUP.md                                   # ไฟล์นี้
```

**Dockerfile** มีหลาย stage และเลือก build ด้วย `target`:
- `backend` – build ด้วย Maven แล้วรัน `.war` บน JRE 21
- `frontend` – ติดตั้ง npm แล้วรัน `node server.js`

**การเชื่อมต่อระหว่าง container** ใช้ชื่อ service เป็น hostname:
- frontend เรียก backend ที่ `http://backend:8080` (ผ่าน path `/api/...`)
- backend เรียก DB ที่ `db:1433` (ส่งค่าผ่าน environment `SPRING_DATASOURCE_*` ใน `docker-compose.yml`)

## 7. แก้ปัญหาเบื้องต้น

- **`Cannot connect to the Docker daemon`** – ยังไม่ได้เปิด Docker Desktop
- **`port is already allocated`** – พอร์ตถูกใช้อยู่ ให้เปลี่ยนค่าพอร์ตใน `.env`
- **container `cs261-db` ไม่ healthy / ปิดตัวเอง** – มักเกิดจากรหัสผ่าน `sa` ไม่ผ่านเงื่อนไขความแข็งแรง ดูสาเหตุด้วย `docker compose logs db` แล้วแก้ `.env` จากนั้น `docker compose down -v` และรันใหม่
- **เปลี่ยนรหัสผ่านใน `.env` แล้วไม่มีผล** – รหัสผ่านถูกบันทึกใน volume ตั้งแต่ครั้งแรก ต้อง `docker compose down -v` ก่อน (ข้อมูล DB จะหาย)
- **เครื่อง Mac M1/M2 (ARM) SQL Server ไม่ขึ้น** – เปิด *Use Rosetta for x86/amd64 emulation* ใน Docker Desktop settings
- **แก้โค้ดแล้วไม่เปลี่ยน** – ต้อง build ใหม่ด้วย `docker compose up --build`
