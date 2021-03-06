import React, { useState, useEffect, useRef } from 'react';
import TopFive from './TopFive/TopFive';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Cell } from 'recharts';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import AnimatedNumber from "animated-number-react";
import axios from 'axios'
import validator from 'validator';
import {isEmpty} from 'is-empty'
import queryString from 'query-string';
import { withResizeDetector } from 'react-resize-detector';
import Papa from 'papaparse';

import infoImg from './src/info.png';
import viewsImg from './src/views.png';
import postsImg from './src/posts.png';
import likesImg from './src/likes.png';
import commentsImg from './src/comments.png';
import followersImg from './src/followers.png';
import refreshImg from './src/refresh.png';
import logoutImg from './src/logout.png';
import downloadImg from './src/download.png';
import './LandingPage.css';

import Excel from 'exceljs'
import xl from 'excel4node'
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

import ReactModal from 'react-modal';

const LandingPage = props => {
    //login select
    const [userType, setUserType] = useState('new');

    // login input 1
    const [followersList, setFollowersList] = useState([])
    const [followersListErrorMessage, setFollowersListErrorMessage] = useState('')
    const [username, setUsername] = useState('')
    const [usernameErrorMessage, setUsernameErrorMessage] = useState('')
    const [password, setPassword] = useState('')
    const [passwordErrorMessage, setPasswordErrorMessage] = useState('')
    const [loginErrorMessage, setLoginErrorMessage] = useState('')
    const [numPosts, setNumPosts] = useState(25)
    const [email, setEmail] = useState('')
    const [sendEmail, setSendEmail] = useState(false)
    const [emailErrorMessage, setEmailErrorMessage] = useState('')
    const [storeMetadataCalled, setStoreMetadataCalled] = useState(false)

    // login input 2
    const [usernameCheck, setUsernameCheck] = useState('')
    const [usernameCheckErrorMessage, setUsernameCheckErrorMessage] = useState('')
    const [usernameCheckResult, setUsernameCheckResult] = useState('')

    // refresh
    const [refreshPopupShow, setRefreshPopupShow] = useState(false)
    const [refreshPassword, setRefreshPassword] = useState('')

    // data
    const [fetchedDate, setFetchedDate] = useState('')

    const canvasElement = useRef(null);
    const [context, setContext] = useState(null)
    const [scraping, setscraping] = useState(false)
    const [scrapePercentage, setScrapePercentage] = useState(0)
    const [searched, setSearched] = useState(false);
    const [data, setData] = useState([]);
    const [activeData, setActiveData] = useState(0);
    const [activeValue, setActiveValue] = useState('averageLikes');
    const [dataKey, setDataKey] = useState(1);
    const [topFiveModal, setTopFiveModal] = useState(false);
    const [topFiveLoading, setTopFiveLoading] = useState(false);

    const [showAboutModal, setShowAboutModal] = useState(false)
    let time = 0;

    

    useEffect(() => {
        setContext(canvasElement.current.getContext('2d'));
        const users = localStorage.getItem('Instalytics_Users');

        let usernameQuery = '' + queryString.parse(window.location.search).username
        if (usernameQuery !== 'undefined' && usernameQuery !== undefined
         && usernameQuery !== null && usernameQuery !== '') {
            handleQueryParamUsername(usernameQuery)
        }
    }, [])

    useEffect(() => {
        if (!context) return;
        startAnimation();
    }, [context])

    useEffect(() => {
        if (!activeValue) return;
        setData(data.sort(compare))
        setDataKey(dataKey + 1)
    }, [activeValue])

    function compare( a, b ) {
        if ( Number(a[activeValue]) < Number(b[activeValue]) || a[activeValue] === 'NaN' ){
          return 1;
        }
        if ( Number(a[activeValue]) > Number(b[activeValue]) || b[activeValue] === 'NaN'){
          return -1;
        }
        return 0;
    }
      
    function color (x, y, r, g, b) {
        if (!canvasElement || !context) return;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`
        context.fillRect(x, y, 10, 10);
    }

    function R (x, y, time) {
        return (Math.floor(200 + 35 * Math.cos((x * x - y * y) / 300 + time)));
    }

    function G (x, y, time) {
        return (Math.floor(130 + 40 * Math.cos((x * x - y * y) * Math.cos(time / 3)) / 300));
    }

    function B (x, y, time) {
        return (Math.floor(136 + 17 * Math.sin(5 * Math.sin(time / 9) + ((x - 100) * (x - 100) + (y - 100) * (y - 100)) / 1100)));
    }

    function startAnimation() {
        for (let x = 0; x <= 31; x++) {
            for (let y = 0; y <= 31; y++) {
                color(x, y, R(x, y, time), G(x, y, time), B(x, y, time));
            }
        }
        time = time + 0.02;
        window.requestAnimationFrame(startAnimation);
    }

    // FORM
    function handleAccountChange(e) {
        setUsername(e.target.value)
    }

    function handlePasswordChange(e) {
        setPassword(e.target.value)
    }

    function handleEmailChange(e) {
        setEmail(e.target.value)
    }

    function handleNumPostsChange(e) {
        setNumPosts(e.value)
    }

    function handleEmailCheckboxChange(e) {
        setSendEmail(!sendEmail)
        setEmail('')
    }

    function handleAccountCheckChange(e) {
        setUsernameCheck(e.target.value)
    }

    function handleOpenAboutModal(e) {
        setShowAboutModal(true)
    }

    function handleCloseAboutModal(e) {
        setShowAboutModal(false)
    }

    function onFollowersListFileUpload(e) {
        setFollowersList([])
        let file = e.target.files[0]
        console.log(file)
        Papa.parse(file, {
            header: true,
            complete: function(results) {
                let followers = results.data.map(a => a.username);
                setFollowersList(followers)
            }
        });
    }

    function getData(uName) {
        const getDataOptions = {
            params: {
                username: uName
            },
            headers: {
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': '*',
            },
        }
        axios.get(process.env.REACT_APP_BACKEND_ADDRESS + '/api/start_instalytics', getDataOptions)
            .then(res => {
                console.log(res.data)
                let sortedData = res.data.sort(compare);
                setData(sortedData);
                setActiveData(sortedData[0]);
            })
            .catch(err => {
                window.location.replace(process.env.REACT_APP_FRONTEND_ADDRESS + '/')
            })

        axios.get(process.env.REACT_APP_BACKEND_ADDRESS + '/api/data-date', getDataOptions)
            .then(res => {
                let month = res.data.date.split('/')[1];
                let day = res.data.date.split('/')[0];
                setFetchedDate(`${day}/${month}`)
            })
            .catch(err => {
                console.log(err)
            })
    }


 
    function handleSubmit(e) {
        e.preventDefault()
        console.log(process.env.REACT_APP_BACKEND_ADDRESS)
        let goodToGo = true

        // check followers
        if (followersList === []) {
            goodToGo = false
            setFollowersListErrorMessage("A csv file with a column of followers is needed")
        } else {
            setFollowersListErrorMessage("")
        }

        // check username
        if (username === '') {
            goodToGo = false
            setUsernameErrorMessage("Username field is required")
        } else {
            setUsernameErrorMessage("")
        }

        // check mail
        if (email === '') {
            goodToGo = false
            setEmailErrorMessage("Email field is required")
        } else if (!validator.isEmail(email)) {
            goodToGo = false
            setEmailErrorMessage("Email is invalid")
        } else {
            setEmailErrorMessage('')
        }

        // // check password
        // if (password === '') {
        //     goodToGo = false
        //     setPasswordErrorMessage("Password field is required")
        // } else {
        //     setPasswordErrorMessage('')
        // }

        // // check email
        // if (sendEmail) { // get mail notification is checked
        //     if (email === '') {
        //         goodToGo = false
        //         setEmailErrorMessage("Email field is required")
        //     } else if (!validator.isEmail(email)) {
        //         goodToGo = false
        //         setEmailErrorMessage("Email is invalid")
        //     } else {
        //         setEmailErrorMessage('')
        //     }
        // } else { // get mail notification is unchecked
        //     setEmailErrorMessage('')
        // }
        
        
        if (goodToGo) {
            const getDataOptions = {
                params: {
                    followers: followersList,
                    username: username,
                    numPosts: numPosts,
                    email: email
                },
                headers: {
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': '*',
                },
            }
            const getScrapeStatusOptions = {
                params: {
                    username: username,
                    sendEmail: sendEmail,
                    email: email
                },
                headers: {
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': '*',
                },
            }

            console.log('calling store-metadata')
            
            // 
            axios.get(process.env.REACT_APP_BACKEND_ADDRESS + '/api/store-metadata', getDataOptions)
                .then(res => {
                    console.log(res.data.message)

                    // set scraping status to show the loadbar
                    setscraping(true)
                    // let intervalId = setInterval(() => {

                    //     console.log('calling scrape-status')
                    //     axios.get(process.env.REACT_APP_BACKEND_ADDRESS + '/api/scrape-status', getScrapeStatusOptions)
                    //         .then(res => {
                    //             console.log(res.data)
                    //             // scraping complete
                    //             if (res.data.status === 'finished') {
                    //                 setLoginErrorMessage('')
                    //                 setScrapePercentage(100)
                    //                 setscraping(false)
                    //                 clearInterval(intervalId)

                    //                 // Scraping is complete, redirect the user to the viewing page
                    //                 window.location.replace(process.env.REACT_APP_FRONTEND_ADDRESS + `/?username=${username}`)
                    //             } 

                    //             // scraping not complete
                    //             else {
                    //                 setScrapePercentage(res.data.percentage)
                    //             }
                    //         })
                    //         .catch(err => {
                    //             console.log(err)
                    //             setscraping(false)
                    //             if (err.response) {
                    //                 setLoginErrorMessage(err.response.data.message)
                    //             }
                    //             clearInterval(intervalId)
                    //         })
                    // }, 3000)
                })
                .catch(err => {
                        console.log(err)
                        setscraping(false)
                        if (err.response) {
                            setLoginErrorMessage(err.response.data.message)
                        }
                    })
            

            // setscraping(true)
            // let intervalId = setInterval(() => {
            //     console.log('calling scrape-status')
            //     axios.get(process.env.REACT_APP_BACKEND_ADDRESS + '/api/scrape-status', getScrapeStatusOptions)
            //         .then(res => {
            //             console.log(res.data)
            //             if (res.data.status === 'finished') {
            //                 setLoginErrorMessage('')
            //                 setScrapePercentage(100)
            //                 setscraping(false)
            //                 clearInterval(intervalId)

            //                 // Scraping is complete, redirect the user to the viewing page
            //                 window.location.replace(process.env.REACT_APP_FRONTEND_ADDRESS + `/?username=${username}`)
            //             }
                        
            //             setScrapePercentage(res.data.percentage)
            //         })
            //         .catch(err => {
            //             console.log(err)
            //             setscraping(false)
            //             if (err.response) {
            //                 setLoginErrorMessage(err.response.data.message)
            //             }
            //             clearInterval(intervalId)
            //         })
            // }, 3000)

        } else {
            console.log("we need something")
        }
    }

    function handleSubmit2 (e) {
        e.preventDefault()

        // reset
        setUsernameCheckResult('')

        if (usernameCheck === '' ){
            setUsernameCheckErrorMessage("Username field is required")
        } else {
            const options = {
                params: {
                    username: usernameCheck,
                },
                headers: {
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': '*',
                },
            }

            axios.get(process.env.REACT_APP_BACKEND_ADDRESS + '/api/check-username', options)
                .then(res => {
                    console.log('handleSubmit2 GOOD')
                    handleWelcomeBackClick(e);                })
                .catch(res => {
                    console.log('no valid username in param')
                    setUsernameCheckResult('bad')
                    setUsernameCheckErrorMessage('We could not find data under the given username, please login')
                })
        }
    }

    function handleQueryParamUsername(usernameQuery) {
        console.log('handleQueryParamUsername', usernameQuery)
        const options = {
            params: {
                username: usernameQuery,
            },
            headers: {
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': '*',
            },
        }

        axios.get(process.env.REACT_APP_BACKEND_ADDRESS + '/api/check-username', options)
            .then(res => {
                setUsername(usernameQuery)
                setSearched(true);
                getData(usernameQuery);
            })
            .catch(res => {
                console.log('no valid username in param')
                setSearched(false);
            })
        return
    }


    // REFRESH
    function refresh(e) {
        e.preventDefault()

        setRefreshPopupShow(true)
    }

    function handleRefreshPasswordChange(e) {
        setRefreshPassword(e.target.value)
    }

    // when they close the popup window 
    // reset the password to an empty string
    // then close the window
    function handleRefreshPopupHide(e) {
        e.preventDefault()

        setRefreshPassword('')
        setRefreshPopupShow(false)
    }

    function handleInitiateRefresh(e) {
        e.preventDefault()
        console.log(username, refreshPassword)
        const options = {
            params: {
                username: username,
                refreshPassword: refreshPassword
            },
            headers: {
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': '*',
            },
        }

        setRefreshPassword('')
        setRefreshPopupShow(false)
        axios.get(process.env.REACT_APP_BACKEND_ADDRESS + '/api/update-metadata', options)
            .then(res => {
                console.log(res)
                getData(username)
            })
            .catch(err => {
                console.log(err)
            })
    }

    // LOGOUT
    function logout(e) {
        e.preventDefault()

        window.location.replace(process.env.REACT_APP_FRONTEND_ADDRESS + '/')
    }

    // SAVE TO EXCEL
    function saveDataToExcel(e) {
        e.preventDefault()

        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        
        console.log(data)
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const excelData = new Blob([excelBuffer], {type: fileType});
        FileSaver.saveAs(excelData, `instalytics_data_${username}.xlsx` + fileExtension);
    }

    
    function handleBarChartClick(data, index) {
        if (!data) return;
        setActiveData(data.activePayload[0].payload)
    }

    function handleSort(e) {
        setActiveValue(e.value)
    }

    function handleWelcomeBackClick(e) {
        e.preventDefault()

        window.location.replace(process.env.REACT_APP_FRONTEND_ADDRESS + `/?username=${usernameCheck}`)
    }

    function handleTopFiveClick() {
        setTopFiveModal(true);       
    }

    let max = Math.max.apply(Math, data.map(function(entry) { if (entry[activeValue] !== 'NaN') {return Number(entry[activeValue]);} else {return 0} }))
    const options = [
        { value: 'averageLikes', label: 'Average Likes' },
        { value: 'averageViews', label: 'Average Views' },
        { value: 'averageComments', label: 'Average Comments' },
        { value: 'VFR', label: 'Video Views to Follower Ratio' },
        { value: 'LFR', label: 'Like to Follower Ratio' },
        { value: 'CFR', label: 'Comment to Follower Ratio' },
    ]

    const optionsNumber = [
        { value: '5', label: '5' },
        { value: '10', label: '10' },
        { value: '15', label: '15' },
        { value: '20', label: '20' },
        { value: '25', label: '25' },
        { value: '30', label: '30' },
    ]

    const formatValue = value => Math.floor(value);
    const ratioFormatValue = value => Number(value).toFixed(2);
    
    const topFive = !activeData.top5 || activeData.top5 === 'NaN' ? null : activeData.top5.map(function(item, i){
        return <TopFive data={item}/>
    })

    return (
        <div className='search-page-container'>
            <ReactModal 
                isOpen={showAboutModal}
                contentLabel="About Instalytics">
                    <p>If you want to view the engagement ratings of list of accounts on Instagram, this is the app to use</p>
                    <p>It showcases all of the account's: </p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;average number of likes vs. follower count</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;average number of views vs. follower count</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;average number of comments vs. follower count</p>
                    <p>It will also show their top 5 posts</p>
                    <p>&nbsp;</p>
                    <p>REQUIREMENTS: </p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) You can always provide your own CSV file but it must have a "username" column of all the accounts</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;b) You need to export your list of followers/followings using 
                        <a href="https://chrome.google.com/webstore/detail/export-list-of-followers/hcdbfckhdcpepllecbkaaojfgipnpbpb?hl=en">this</a>
                        chrome extension.</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- note that you MUST export the file as a CSV, not Excel</p>
                    <p>NOTE: </p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this will not fetch info from any PRIVATE accounts from the list</p>
                <button onClick={e => handleCloseAboutModal(e)}>Got it!</button>
            </ReactModal>
            <div className='nav'>
                <p className='nav-logo'>instalytics</p>
                <p className='nav-logo'>|</p>
                <p className='nav-logo' onClick={e => handleOpenAboutModal(e)}>about</p>
                <div className='nav-right'>
                    {
                        searched
                        ?
                        <div className='nav-right-button-container'>
                            <div className='search-page-date-button-container'>
                                <p>{fetchedDate}</p>
                                <button className='search-page-date-button' onClick={e => refresh(e)}><img src={refreshImg}></img></button>
                            </div>
                            <button className='search-page-logout-button' onClick={e => saveDataToExcel(e)}><img src={downloadImg}></img></button>
                            <button className='search-page-logout-button' onClick={e => logout(e)}><img src={logoutImg}></img></button>
                        </div>
                        : 
                        null
                    }
                </div>
            </div>
            <div className={`search-page-search-container ${searched ? '' : 'search-page-search-container-inactive'}`} style={{height: `${searched ? '60px' : ''}`}}>
                <canvas ref={canvasElement} id="canvas" width='32px' height={`${searched ? '5px' : '32px'}`} style={{height: `${searched ? '60px' : ''}`, opacity: `${searched ? '0.7' : ''}`}}/>
                {searched ? 
                <label className='search-page-username-label'>{username}</label>
                : 
                <div className='search-page-transition'>
                    <div className='search-page-user-selection'>
                        <p className='search-page-user-new' onClick={() => setUserType('new')} style={{color: `${userType === 'new' ? 'white' : 'rgba(255, 255, 255, 0.47)'}`}}>New User</p>
                        <p className='search-page-user-returning' onClick={() => setUserType('returning')} style={{color: `${userType === 'returning' ? 'white' : 'rgba(255, 255, 255, 0.47)'}`}}>Returning User</p>
                    </div>
                    {userType === 'new' ? 
                        <div>
                            {
                                scraping
                                ?
                                // <div>
                                //     <div className='progress-bar'>
                                //         <div className='progress-bar-content' style={{width: `${scrapePercentage / 100 * 360}px`}}>

                                //         </div>
                                //     </div>
                                //     <p className='progress-percentage'>{scrapePercentage}%</p>
                                // </div>
                                <div>
                                    We will now send you a notification email once we are done!
                                </div>
                                :
                                <form onSubmit={e => handleSubmit(e)} className='search-page-form'>
                                    <input type="file" name="file" onChange={onFollowersListFileUpload}/>
                                    <span className='search-page-error'>{followersListErrorMessage}</span>

                                    <input className='search-page-input' type="text" value={username} placeholder='Username' onChange={e => handleAccountChange(e)}/>
                                    <span className='search-page-error'>{usernameErrorMessage}</span>
                                    <input className='search-page-input' type="email" value={email} placeholder='Email' onChange={e => handleEmailChange(e)}
                                        // disabled={sendEmail ? "" : "disabled"} 
                                        // style={{opacity: `${sendEmail ? '': '0.3'}`}}
                                        />
                                    <span className='search-page-error'>{emailErrorMessage}</span>
                                    {/* <input className='search-page-input' type="password" value={password} placeholder='Password' onChange={e => handlePasswordChange(e)}/>
                                    <span className='search-page-error'>{passwordErrorMessage}</span> */}
                                    <span className='search-page-error login-error'>{loginErrorMessage}</span>
                                    <label className='search-page-dropdown-label' for="numPosts">Number of Posts:</label>
                                    <Dropdown name="numPosts" id="numPosts" options={optionsNumber} onChange={(e) => handleNumPostsChange(e)} value={'25'} placeholder="Select an option" />
                                    <div className='search-page-email-information'>
                                        <img className='search-page-email-information-image' src={infoImg} alt=""/>
                                        <div>
                                            <p>
                                                Due to Instagram making rapid changes to improve their securities,
                                                the official API became difficult to use by a non-business developer such as myself.
                                            </p>
                                            <p>
                                                Another option that I had to use to make this app possible is quite tedious and takes a lot of time.
                                                This is because I had to find a way get data without using the official API while avoiding being rate limited / running into any other limitations Instagram adds.
                                            </p>
                                            <p>So for now, I will have to email you once the data is fetched and is ready to be viewed.</p>
                                        </div>
                                    </div>
                                    {/* <div className="cboxB">
                                        <input type="checkbox" id="boxB" checked={sendEmail} onChange={e => handleEmailCheckboxChange(e)}/>
                                        <label for="boxB">Opt In</label>
                                    </div> */}
                                    {/* <input className='search-page-input' type="email" value={email} placeholder='Email' onChange={e => handleEmailChange(e)}
                                        disabled={sendEmail ? "" : "disabled"} 
                                        style={{opacity: `${sendEmail ? '': '0.3'}`}}/>
                                    <span className='search-page-error'>{emailErrorMessage}</span> */}
                                    <button className='search-page-submit' type="submit">Analyze</button>
                                </form>
                            }
                        </div>
                    :
                    <form onSubmit={e => handleSubmit2(e)} className='search-page-form'>
                        <input className='search-page-input' type="text" value={usernameCheck} placeholder='Username' onChange={e => handleAccountCheckChange(e)}/>
                        <span className='search-page-error'>{usernameCheckErrorMessage}</span>
                        <button className='search-page-submit' type="submit">Find</button>
                    </form>
                    }
                </div>
                }
            </div>
            <div className='search-page-data-container' style={{display: `${searched ? '' : 'none'}`}}>
                <div className='search-page-chart-container'>
                    <Dropdown options={options} onChange={(e) => handleSort(e)} value={activeValue} placeholder="Select an option" />
                    {data.length !== 0 ?
                    <div className='search-page-data'>
                        <ResponsiveContainer width='100%' height={data.length * 60}>
                            <BarChart data={data} layout='vertical' key={dataKey} margin={{ top: 10, left: 10, right: 10, bottom: 10 }} onClick={(data, index) => handleBarChartClick(data, index)}>
                                <CartesianGrid strokeDasharray="5 5" horizontal={false} />
                                <YAxis type='category' dataKey="username" width={130}  tickLine={false}/>
                                <XAxis type='number' domain={[0, max]} allowDecimals={false} height={30} axisLine={false} tickLine={false} interval={'preserveStart'} tickCount={6}/>
                                <Tooltip cursor={{fill: '#f7f7f7'}}/>
                                <Bar dataKey={activeValue}>
                                    {
                                        data.map((entry, index) => (
                                            <Cell cursor="pointer" fill={entry.username === activeData.username ? '#edbed2' : '#adb8ff' } key={`cell-${index}`}/>
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                    </div>
                        : 
                    null}
                </div>
                
                <div className='search-page-current-data'>
                    <div className='search-page-averages'>
                        <p className='search-page-data-header'>{activeData.username}'s Averages</p>
                        <div className='search-page-data-averages'>
                            <div className='search-page-data-average'>
                                <img src={viewsImg} className='search-page-data-image'/>
                                <AnimatedNumber
                                className='search-page-data-value-average'
                                value={activeData.averageViews}
                                duration={300}
                                formatValue={formatValue}
                                />
                            </div>
                            <div className='divider-average'></div>
                            <div className='search-page-data-average'>
                                <img src={likesImg} className='search-page-data-image'/>
                                <AnimatedNumber
                                className='search-page-data-value-average'
                                value={activeData.averageLikes}
                                duration={300}
                                formatValue={formatValue}
                                />
                            </div>
                            <div className='divider-average'></div>
                            <div className='search-page-data-average'>
                                <img src={commentsImg} className='search-page-data-image'/>
                                <AnimatedNumber
                                className='search-page-data-value-average'
                                value={activeData.averageComments}
                                duration={300}
                                formatValue={formatValue}
                                />                            
                            </div>
                        </div>
                    </div>
                    <button className='search-page-top-five-button' onClick={() => handleTopFiveClick()}>
                        {topFiveLoading ? <div className='spinner'></div> : <img src={postsImg} className='search-page-top-five-button-image'/>}
                    </button>
                    <div className='search-page-averages'>
                        <p className='search-page-data-header'>{activeData.username}'s Ratios</p>
                        <div className='search-page-data-ratios'>
                            <div className='search-page-data-average'>
                                <div className='search-page-ratio-container'>
                                    <img src={viewsImg} className='search-page-data-image-ratio'/>
                                    <p className='search-page-data-divide-ratio'>/</p>
                                    <img src={followersImg} className='search-page-data-image-ratio'/>
                                </div>
                                <AnimatedNumber
                                className='search-page-data-value'
                                value={activeData.VFR}
                                duration={300}
                                formatValue={ratioFormatValue}
                                />                            
                            </div>
                            <div className='divider'></div>
                            <div className='search-page-data-average'>
                                <div className='search-page-ratio-container'>
                                    <img src={likesImg} className='search-page-data-image-ratio'/>
                                    <p className='search-page-data-divide-ratio'>/</p>
                                    <img src={followersImg} className='search-page-data-image-ratio'/>
                                </div>                                
                                <AnimatedNumber
                                className='search-page-data-value'
                                value={activeData.LFR}
                                duration={300}
                                formatValue={ratioFormatValue}
                                />
                            </div>
                            <div className='divider'></div>
                            <div className='search-page-data-average'>
                                <div className='search-page-ratio-container'>
                                    <img src={commentsImg} className='search-page-data-image-ratio'/>
                                    <p className='search-page-data-divide-ratio'>/</p>
                                    <img src={followersImg} className='search-page-data-image-ratio'/>
                                </div>                                
                                <AnimatedNumber
                                className='search-page-data-value'
                                value={activeData.CFR}
                                duration={300}
                                formatValue={ratioFormatValue}
                                />                            
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='search-page-top-five-modal-background' style={{'display': `${topFiveModal ? '' : 'none'}`}} onClick={() => setTopFiveModal(false)}>
                <div className='search-page-top-five-modal' onClick={(e) => e.stopPropagation()}>
                    <div className='search-page-top-five-modal-header'>Top Posts</div>
                    {topFive}
                </div>
            </div>
            <div className='search-page-top-five-modal-background' style={{'display': `${refreshPopupShow ? '' : 'none'}`}} onClick={(e) => handleRefreshPopupHide(e)}>
                <div className='search-page-top-five-modal' onClick={(e) => e.stopPropagation()}>
                    <div className='search-page-top-five-modal-header'>Update Data</div>
                    
                    <form onSubmit={e => handleInitiateRefresh(e)} className='search-page-form'>
                        <input className='search-page-input refresh-password' type="password" value={refreshPassword} placeholder='Password' onChange={e => handleRefreshPasswordChange(e)}/>
                        {/* <span className='search-page-error'>{passwordErrorMessage}</span> */}

                        <button className='search-page-submit' type="submit">Update</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LandingPage