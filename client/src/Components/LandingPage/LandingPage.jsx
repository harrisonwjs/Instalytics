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

import infoImg from './info.png';
import viewsImg from './views.png';
import postsImg from './posts.png';
import likesImg from './likes.png';
import commentsImg from './comments.png';
import followersImg from './followers.png';
import './LandingPage.css';

// for harrison, mario can delete
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'

const LandingPage = props => {
    //login select
    const [userType, setUserType] = useState('new');
    // login input 1
    const [username, setUsername] = useState('')
    const [usernameErrorMessage, setUsernameErrorMessage] = useState('')
    const [password, setPassword] = useState('')
    const [passwordErrorMessage, setPasswordErrorMessage] = useState('')
    const [email, setEmail] = useState('')
    const [sendEmail, setSendEmail] = useState(false)
    const [emailErrorMessage, setEmailErrorMessage] = useState('')
    // login input 2
    const [usernameCheck, setUsernameCheck] = useState('')
    const [usernameCheckErrorMessage, setUsernameCheckErrorMessage] = useState('')
    const [usernameCheckResult, setUsernameCheckResult] = useState('')

    // refresh
    const [refreshPopupShow, setRefreshPopupShow] = useState(false)
    const [refreshPassword, setRefreshPassword] = useState('')

    const canvasElement = useRef(null);
    const [context, setContext] = useState(null)
    const [searched, setSearched] = useState(false);
    const [data, setData] = useState([]);
    const [activeData, setActiveData] = useState(0);
    const [activeValue, setActiveValue] = useState('averageLikes');
    const [dataKey, setDataKey] = useState(1);
    const [topFiveData, setTopFiveData] = useState(null);
    const [topFiveModal, setTopFiveModal] = useState(false);
    const [topFiveLoading, setTopFiveLoading] = useState(false);
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

    function handleAccountChange(e) {
        setUsername(e.target.value)
    }

    function handlePasswordChange(e) {
        setPassword(e.target.value)
    }

    function handleEmailChange(e) {
        setEmail(e.target.value)
    }

    function handleEmailCheckboxChange(e) {
        setSendEmail(!sendEmail)
    }

    function handleAccountCheckChange(e) {
        setUsernameCheck(e.target.value)
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
        axios.get('http://localhost:5000/api/start_instalytics', getDataOptions)
            .then(res => {
                let sortedData = res.data.sort(compare);
                setData(sortedData);
                setActiveData(sortedData[0]);
            })
    }
 
    function handleSubmit(e) {
        e.preventDefault()

        let goodToGo = true

        // check username
        if (username === '') {
            goodToGo = false
            setUsernameErrorMessage("Username field is required")
        } else {
            setUsernameErrorMessage("")
        }

        // check password
        if (password === '') {
            goodToGo = false
            setPasswordErrorMessage("Password field is required")
        } else {
            setPasswordErrorMessage('')
        }

        // check email
        if (sendEmail) {
            if (email === '') {
                goodToGo = false
                setEmailErrorMessage("Email field is required")
            } else if (!validator.isEmail(email)) {
                goodToGo = false
                setEmailErrorMessage("Email is invalid")
            } else {
                setEmailErrorMessage('')
            }
        } else {
            setEmailErrorMessage('')
        }
        
        
        if (goodToGo) {
            const options = {
                params: {
                    login_user: username,
                    login_pass: password,
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
            axios.get('http://localhost:5000/api/store-metadata', options)
                .then(res => {
                    // setSearched(true);
                    // getData(username);
                    window.location.replace(`http://localhost:3000/?username=${username}`)
                    
                    
            }).catch(res => {
                if (res.response) {
                    console.log(res.response.data.message)
                } else {
                    console.log(res)
                }
            })
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

            axios.get('http://localhost:5000/api/check-username', options)
                .then(res => {
                    console.log('handleSubmit2 GOOD')
                    setUsernameCheckResult('good')
                })
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

        axios.get('http://localhost:5000/api/check-username', options)
            .then(res => {
                setUsername(usernameQuery)
                setSearched(true);
                getData(usernameQuery);
            })
            .catch(res => {
                console.log('no valid username in param')
                setSearched(false);
            })
    }

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

        axios.get('http://localhost:5000/api/update-metadata', options)
            .then(res => {
                console.log(res)
                getData(username)
            })
            .catch(err => {
                console.log(err)
            })
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

        window.location.replace(`http://localhost:3000/?username=${usernameCheck}`)
    }

    function handleTopFiveClick() {
        setTopFiveLoading(true);

        const options = {
            params: {
                logged_in_username: username,
                target_username: activeData.username
            },
            headers: {
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': '*',
            },
        }

        axios.get('http://localhost:5000/api/top-5-posts', options)
        .then((response) => {
            console.log(response.data)
            setTopFiveData(response.data);
            setTopFiveLoading(false)
            setTopFiveModal(true);
        })
        .catch((error) => {
            console.log(error)
            setTopFiveLoading(false);
        })
    }

    function testEmail(e) {
        e.preventDefault()

        const options = {
            params: {
                email: 'gethannahbakered@gmail.com',
                uname: username
            },
            headers: {
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': '*',
            },
        }

        axios.get('http://localhost:5000/api/test-email', options)
    }

    let max = Math.max.apply(Math, data.map(function(entry) { if (entry[activeValue] !== 'NaN') {return Number(entry[activeValue]);} else {return 0} }))
    const options = [
        { value: 'averageLikes', label: 'Average Likes' },
        { value: 'averageViews', label: 'Average Views' },
        { value: 'averageComments', label: 'Average Comments' },
        { value: 'LVR', label: 'Like to Views Ratio' },
        { value: 'LFR', label: 'Like to Follower Ratio' },
        { value: 'LCR', label: 'Like to Comment Ratio' },
    ]

    const formatValue = value => Math.floor(value);
    const ratioFormatValue = value => Number(value).toFixed(2);
    
    const topFive = !topFiveData ? null : topFiveData.map(function(item, i){
                                                return <TopFive data={item}/>
                                            })

    return (
        <div className='search-page-container'>
            <div className='nav'>
                <p className='nav-logo'>instalytics</p>
                {
                    searched
                    ?
                    <button onClick={e => refresh(e)}>Update</button>
                    : 
                    null
                }
            </div>
            <div className='search-page-search-container' style={{height: `${searched ? '60px' : ''}`}}>
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
                    <form onSubmit={e => handleSubmit(e)} className='search-page-form'>
                        <input className='search-page-input' type="text" value={username} placeholder='Username' onChange={e => handleAccountChange(e)}/>
                        <span className='search-page-error'>{usernameErrorMessage}</span>
                        <input className='search-page-input' type="password" value={password} placeholder='Password' onChange={e => handlePasswordChange(e)}/>
                        <span className='search-page-error'>{passwordErrorMessage}</span>
                        <div className='search-page-email-information'>
                            <img className='search-page-email-information-image' src={infoImg} alt=""/>
                            <div>
                                <p>If you choose to fetch a lot of posts, it will take a while.</p>
                                <p>You can opt to get off the website and have us email you when the data is ready.</p>
                            </div>
                        </div>
                        <div className="cboxB">
                            <input type="checkbox" id="boxB" checked={sendEmail} onChange={e => handleEmailCheckboxChange(e)}/>
                            <label for="boxB">Opt In</label>
                        </div>
                        <input className='search-page-input' type="email" value={email} placeholder='Email' onChange={e => handleEmailChange(e)} disabled={sendEmail ? "" : "disabled"} style={{opacity: `${sendEmail ? '': '0.3'}`}}/>
                        <span className='search-page-error'>{emailErrorMessage}</span>
                        <button className='search-page-submit' type="submit">Analyze</button>
                    </form>
                    :
                    <form onSubmit={e => handleSubmit2(e)} className='search-page-form'>
                        <input className='search-page-input' type="text" value={usernameCheck} placeholder='Username' onChange={e => handleAccountCheckChange(e)}/>
                        <span className='search-page-error'>{usernameCheckErrorMessage}</span>
                        <button className='search-page-submit' type="submit">Find</button>
                    </form>
                    }
                    
                    {
                        usernameCheckResult === 'good'
                        ?
                        <div>
                            <p>Welcome Back {usernameCheck}</p>
                            <button onClick={e => handleWelcomeBackClick(e)}>Go see data</button>
                        </div>
                        :
                        null
                    }

                </div>
                }
            </div>
            <div className='search-page-data-container' style={{display: `${searched ? '' : 'none'}`}}>
                <div className='search-page-chart-container'>
                    <Dropdown options={options} onChange={(e) => handleSort(e)} value={activeValue} placeholder="Select an option" />
                    {data.length !== 0 ?
                    <ResponsiveContainer className='search-page-data' width='100%' height='95%'>
                        
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
                                    <img src={likesImg} className='search-page-data-image-ratio'/>
                                    <p className='search-page-data-divide-ratio'>/</p>
                                    <img src={viewsImg} className='search-page-data-image-ratio'/>
                                </div>
                                <AnimatedNumber
                                className='search-page-data-value'
                                value={activeData.LVR}
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
                                    <img src={likesImg} className='search-page-data-image-ratio'/>
                                    <p className='search-page-data-divide-ratio'>/</p>
                                    <img src={commentsImg} className='search-page-data-image-ratio'/>
                                </div>                                
                                <AnimatedNumber
                                className='search-page-data-value'
                                value={activeData.LCR}
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