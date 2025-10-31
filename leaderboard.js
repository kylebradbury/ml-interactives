import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0'

// ---------- CONFIG: Supabase project values ----------
const SUPABASE_URL = "https://wzqqwuvozlvkfnpbxvut.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXF3dXZvemx2a2ZucGJ4dnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MjQwNTIsImV4cCI6MjA3MzAwMDA1Mn0.TEhPyS5QWlyXHe_OL0L_cEOiM_h8Qa8T7eV8OLrD1JQ"
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const leaderboardEl = document.getElementById("leaderboard")

const clearBtn = document.getElementById('clearBtn');
const loginBtn = document.getElementById('loginBtn');

export async function submitScore(team, score) {

    try {
    const { error } = await supabase
        .from("scores")
        .insert([{ team, score }])

    if (error) {
        console.error("Supabase insert error:", error)
        alert("There was an error submitting the score. See console.")
    } else {
        await loadLeaderboard()
    }
    } catch (err) {
    console.error("Network / unexpected error:", err)
    alert("Network error while submitting score.")
    } finally {
    setTimeout(() => {  }, 2000)
    }
}

async function loadLeaderboard() {
    try {
    // Fetch recent rows (small scale: client-side aggregation is fine)
    const { data, error } = await supabase
        .from("scores")
        .select("team, score, created_at")
        .order("created_at", { ascending: true })
        .limit(1000) // adjust as needed

    if (error) {
        console.error("Supabase select error:", error)
        return
    }

    const sorted = data
        .sort((a, b) => new Date(b.score) - new Date(a.score))
        .slice(0, 10) // top N

    // Render
    leaderboardEl.innerHTML = ""
    if (sorted.length === 0) {
        leaderboardEl.innerHTML = "<p>No scores yet</p>"
    } else {
        const table = document.createElement("table");
        
        // ----- Create header row -----
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        // const headers = ['Rank','Name', 'Score', 'Date'];
        const headers = ['Rank','Name', 'Score'];
        headers.forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            th.scope = "col";
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // ----- Create body rows -----
        const tbody = document.createElement("tbody");
        let rank = 1;

        // Date formatting
        const options = {
            month: "short",   // e.g. "Oct"
            day: "numeric",   // e.g. "28"
            hour: "2-digit",
            minute: "2-digit",
            hour12: false      // or false for 24-hour format
        };

        sorted.forEach(rowData => {
            const row = document.createElement("tr");
            const date = new Date(rowData.created_at);
            // const content = [`${rank}`,`${rowData.team}`, `${rowData.score}`, date.toLocaleString("en-US", options)];
            const content = [`${rank}`,`${rowData.team}`, `${rowData.score}`];
            content.forEach(cellData => {
                const td = document.createElement("td");
                td.textContent = cellData;
                row.appendChild(td);
            });
            tbody.appendChild(row);
            rank += 1;
        });

        table.appendChild(thead);
        table.appendChild(tbody);

        // ----- Add the table to the page -----
        leaderboardEl.appendChild(table);
    }
    } catch (err) {
    console.error(err)
    }
}

async function clearLeaderboard() {
    // console.log('HERE')
    // authenticate()
    try {
        const { data, error } = await supabase
            .from("scores")
            .delete()
            .gte('id', 0); // Assuming 'id' is a numeric column and no id will ever be 0
        
        if (error) {
            console.error('Error deleting all rows:', error.message);
        } else {
            console.log('All rows deleted successfully:', data);
        }
    } catch (err) {
        console.error(err)
    }
    loadLeaderboard()
}

// Subscribe to new scores
const channel = supabase
.channel('scores-changes') // name this channel anything you like
.on(
    'postgres_changes',
    {
    event: '*',
    schema: 'public',
    table: 'scores',
    },
    (payload) => {
    console.log("New score inserted:", payload.new)
    loadLeaderboard() // just refresh the leaderboard
    }
)
.subscribe()

async function authenticate() {
    const email = prompt("Supabase User Email:");
    const password = prompt("Supabase User Password:");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        console.error('Sign-in error:', error.message);
    } else {
        console.log('User signed in:', data.user);
    }
}

async function checkAuthentication() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting user:', error.message);
        return false; // An error occurred, likely not authenticated
    }

    if (user) {
        console.log('User is authenticated:', user);
        return true; // User is authenticated
    } else {
        console.log('User is not authenticated.');
        return false; // User is not authenticated
    }
}

// Grey out login button if authenticaion passes, otherwise, present opportunity to enter credentials
async function clickedLogin() {
    const authenticated = await checkAuthentication();
    if (authenticated) {
        // Grey out the button
        console.log('AUTHENTIC!');
    } else {
        authenticate();
    }
}


// Hook up event listeners (preferred over inline onclick)
clearBtn.addEventListener("click", clearLeaderboard)
loginBtn.addEventListener("click", clickedLogin)

// Load leaderboard at startup
window.addEventListener("DOMContentLoaded", loadLeaderboard)
let x = await checkAuthentication();
console.log(`Status = ${x}`);