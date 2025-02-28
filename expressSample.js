var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
var app = express();

const connection = mysql.createConnection({
    host: '',
    user: '',
    password: '',
    database: '',
    ssl: {
        rejectUnauthorized: true,
    }
});

connection.connect((err) => {
    if (err) {
        console.error("MySQL 연결 실패: ", err);
        return;
    }
    console.log("MySQL 연결 성공!");
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.post("/password", (req, res) => {
    const userInputPassword = req.body.password;
    const saltRounds = 10;
    bcrypt.hash(userInputPassword, saltRounds, function (err, hash) {
        // Store hash in your password DB.
        res.json(hash);
    });
})

app.post("/passwordCheck", (req, res) => {
    const userLoginId = req.body.id;
    const userInputPassword = req.body.password;
    const sql = "SELECT user_password FROM user WHERE user_login_id =?"
    connection.query(sql, [userLoginId], (err, result) => {
        const userDbPassword = result[0].user_password;
        bcrypt.compare(userInputPassword, userDbPassword, function (err, result) {
            res.json(result)
        });
    });
})

app.post("/signup", (req, res) => {
    const { id, password, name, email, phonenum, nickname, team_type, team_num, instagram_id, account_no, bank_code, introduce, genre, albumexp, performanceexp } = req.body;
    console.log(req.body)
    console.error("입력값 없음: ", req.body);
    if (!id || !password) {
        return res.status(400).json({ message: "id와 password를 입력하세요." });
    }

    // 비밀번호 해싱 후 DB 저장
    const saltRounds = 10;
    console.log("email", email)
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error("Hashing error: ", err);
            return res.status(500).json({ message: "Error hashing password" });
        }

        connection.query("select count(*) as count FROM user WHERE user_login_id = ?", [id], (err, result) => {
            console.log("id count", result)
            if (err) throw err;
            else {
                if (result[0].count > 0) {
                    console.log("id count", result)
                    res.json("id duplicated!")
                }
            }
        })

        connection.query(
            "INSERT INTO user (user_login_id, user_password, user_name, user_email, user_phonenum, user_nickname, user_team_type, user_team_num, user_instagram_id, user_account_no, user_bank_code, user_introduce, user_genre, user_albumexp, user_performance_exp) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [id, hash, name, email, phonenum, nickname, team_type, team_num, instagram_id, account_no, bank_code, introduce, genre, albumexp, performanceexp],  // 비밀번호를 해싱한 값으로 저장
            (error, results) => {
                if (error) {
                    console.error("DB Insert Error: ", error);
                    return res.status(500).json({ message: "Internal Server Error" });
                }
                res.json({ id, message: "Signup successful" });
            }
        );
    });
});

app.post("/login", (req, res) => {
    console.log(req.body);
    const { id, password } = req.body;

    connection.query("SELECT * FROM USER WHERE user_login_id= ?", [id], (err, result) => {
        console.log();
        if (result.length == 0) {
            res.json("미등록된 사용자 입니다.");
        }
        else {
            console.log(result[0].user_login_id);
            console.log(req.body.id);
            let secretKey = "12nhnhbbhub"
            if (req.body.id == result[0].user_login_id) {
                const isPasswordcorrect = checkPassword(id, password);
                if (isPasswordcorrect) {
                        const token = jwt.sign(
                            { id: result[0].user_id },  // Payload (사용자 정보)
                            secretKey,              // Secret Key (서명)
                            { expiresIn: "1h" }     // 만료 시간 설정 (1시간)
                        );
                        res.json("로그인 성공");
                }
                else res.json("비밀번호가 틀렸습니다.");
            }
            else res.json("아이디가 올바르지 않습니다.");
        }
    })
})

app.get("/hello", (req, res) => {
    let car = {
        name: "sonata",
        ph: 200,
    }
    res.json(car);
})

const checkPassword = async function (user_login_id, originalPassword) {
    const sql = "SELECT * FROM USER WHERE user_login_id= ?"
    console.log("check function")
    connection.query(sql, [user_login_id], async (err, result) => {
        console.log(result[0].user_password);
        console.log(originalPassword);

        const correctPassword = await bcrypt.compare(
            originalPassword, result[0].user_password)

        console.log(correctPassword);
        return correctPassword;
    }
    )
}



app.listen(3000, () => {
    console.log("server is started")
})

app.get("/search", (req,res)=>{
    let {userSearching} = req.query;
    console.log(req.query);
    userSearching = `%${userSearching}%`
    console.log(userSearching);
    connection.query("SELECT * FROM place where place_name LIKE ?", [userSearching], (err, result) => {
    res.json(result);
    })
})

app.post("/reservation", (req, res) => {
    
})