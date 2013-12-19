tmux [source](https://gist.github.com/andreyvit/2921703)
========================================================

(C-x means ctrl+x, M-x means alt+x)


## Prefix key

The default prefix is C-b. If you (or your muscle memory) prefer C-a, you need to add this to `~/.tmux.conf`:

    # remap prefix to Control + a
    set -g prefix C-a
    # bind 'C-a C-a' to type 'C-a'
    bind C-a send-prefix
    unbind C-b

I'm going to assume that C-a is your prefix.


## Sessions, windows, panes

Session is a set of windows, plus a notion of which window is current.

Window is a single screen covered with panes. (Once might compare it to a ‘virtual desktop’ or a ‘space’.)

Pane is a rectangular part of a window that runs a specific command, e.g. a shell.


## Getting help

Display a list of keyboard shortcuts:

    C-a ?

Navigate using Vim or Emacs shortcuts, depending on the value of `mode-keys`. Emacs is the default, and if you want Vim shortcuts for help and copy modes (e.g. j, k, C-u, C-d), add the following line to `~/.tmux.conf`:

    setw -g mode-keys vi

Any command mentioned in this list can be executed as `tmux something` or `C-a :something` (or added to `~/.tmux.conf`).


## Managing sessions

Creating a session:

    tmux new-session -s work

Create a new session that shares all windows with an existing session, but has its own separate notion of which window is current:

    tmux new-session -s work2 -t work

Attach to a session:

    tmux attach -t work

Detach from a session: `C-a d`.

Switch between sessions:

    C-a (          previous session
    C-a )          next session
    C-a L          ‘last’ (previously used) session
    C-a s          choose a session from a list

Other:

    C-a $          rename the current session
    C-a


## Managing windows

Create a window:

    C-a c          create a new window

Switch between windows:

    C-a 1 ...      switch to window 1, ..., 9, 0
    C-a 9
    C-a 0
    C-a p          previous window
    C-a n          next window
    C-a l          ‘last’ (previously used) window
    C-a w          choose window from a list

Switch between windows with a twist:

    C-a M-n        next window with a bell, activity or
                   content alert
    C-a M-p        previous such window


Other:

    C-a ,          rename the current window
    C-a &          kill the current window


## Managing split panes

Creating a new pane by splitting an existing one:

    C-a "          split vertically (top/bottom)
    C-a %          split horizontally (left/right)

Switching between panes:

    C-a left       go to the next pane on the left
    C-a right      (or one of these other directions)
    C-a up
    C-a down
    C-a o          go to the next pane (cycle through all of them)
    C-a ;          go to the ‘last’ (previously used) pane

Moving panes around:

    C-a {          move the current pane to the previous position
    C-a }          move the current pane to the next position
    C-a C-o        rotate window ‘up’ (i.e. move all panes)
    C-a M-o        rotate window ‘down’
    C-a !          move the current pane into a new separate
                   window (‘break pane’)
    C-a :move-pane -t :3.2
                   split window 3's pane 2 and move the current pane there

Resizing panes:

    C-a M-up, C-a M-down, C-a M-left, C-a M-right
                   resize by 5 rows/columns
    C-a C-up, C-a C-down, C-a C-left, C-a C-right
                   resize by 1 row/column

Applying predefined layouts:

    C-a M-1        switch to even-horizontal layout
    C-a M-2        switch to even-vertical layout
    C-a M-3        switch to main-horizontal layout
    C-a M-4        switch to main-vertical layout
    C-a M-5        switch to tiled layout
    C-a space      switch to the next layout


Other:

    C-a x          kill the current pane
    C-a q          display pane numbers for a short while


## Other config file settings

Force a reload of the config file on C-a r:

    unbind r
    bind r source-file ~/.tmux.conf


VIM
===

Cursor movement
---------------

    h - move left
    j - move down
    k - move up
    l - move right
    w - jump by start of words (punctuation considered words)
    W - jump by words (spaces separate words)
    e - jump to end of words (punctuation considered words)
    E - jump to end of words (no punctuation)
    b - jump backward by words (punctuation considered words)
    B - jump backward by words (no punctuation)
    0 - (zero) start of line
    ^ - first non-blank character of line
    $ - end of line
    G - Go To command (prefix with number - 5G goes to line 5)
    Note: Prefix a cursor movement command with a number to repeat it. For example, 4j moves down 4 lines.


Insert Mode - Inserting/Appending text
--------------------------------------

    i - start insert mode at cursor
    I - insert at the beginning of the line
    a - append after the cursor
    A - append at the end of the line
    o - open (append) blank line below current line (no need to press return)
    O - open blank line above current line
    ea - append at end of word
    Esc - exit insert mode


Editing
-------

    r - replace a single character (does not use insert mode)
    J - join line below to the current one
    cc - change (replace) an entire line
    cw - change (replace) to the end of word
    c$ - change (replace) to the end of line
    s - delete character at cursor and subsitute text
    S - delete line at cursor and substitute text (same as cc)
    xp - transpose two letters (delete and paste, technically)
    u - undo
    . - repeat last command


Marking text (visual mode)
--------------------------

    v - start visual mode, mark lines, then do command (such as y-yank)
    V - start Linewise visual mode
    o - move to other end of marked area
    Ctrl+v - start visual block mode
    O - move to Other corner of block
    aw - mark a word
    ab - a () block (with braces)
    aB - a {} block (with brackets)
    ib - inner () block
    iB - inner {} block
    Esc - exit visual mode


Visual commands
---------------

    > - shift right
    < - shift left
    y - yank (copy) marked text
    d - delete marked text
    ~ - switch case


Cut and Paste
-------------

    yy - yank (copy) a line
    2yy - yank 2 lines
    yw - yank word
    y$ - yank to end of line
    p - put (paste) the clipboard after cursor
    P - put (paste) before cursor
    dd - delete (cut) a line
    dw - delete (cut) the current word
    x - delete (cut) current character


Exiting
-------

    :w - write (save) the file, but don't exit
    :wq - write (save) and quit
    :q - quit (fails if anything has changed)
    :q! - quit and throw away changes


Search/Replace
--------------

    /pattern - search for pattern
    ?pattern - search backward for pattern
    n - repeat search in same direction
    N - repeat search in opposite direction
    :%s/old/new/g - replace all old with new throughout file
    :%s/old/new/gc - replace all old with new throughout file with confirmations


Working with multiple files
---------------------------

    :e filename - Edit a file in a new buffer
    :bnext (or :bn) - go to next buffer
    :bprev (of :bp) - go to previous buffer
    :bd - delete a buffer (close a file)
    :sp filename - Open a file in a new buffer and split window
    ctrl+ws - Split windows
    ctrl+ww - switch between windows


Bundles
-------

    :BundleList          - list configured bundles
    :BundleInstall(!)    - install(update) bundles
    :BundleSearch(!) foo - search(or refresh cache first) for foo
    :BundleClean(!)      - confirm(or auto-approve) removal of unused bundles

Folding
-------

    zf#j      - creates a fold from the cursor down # lines.
    zf/string - creates a fold from the cursor to string .
    zj        - moves the cursor to the next fold.     <REMAPPED to newline below w/o insert>
    zk        - moves the cursor to the previous fold. <REMAPPED to newline above w/o insert>
    zo        - opens a fold at the cursor.
    zO        - opens all folds at the cursor.
    zm        - increases the foldlevel by one.
    zM        - closes all open folds.
    zr        - decreases the foldlevel by one.
    zR        - decreases the foldlevel to zero -- all folds will be open.
    zd        - deletes the fold at the cursor.
    zE        - deletes all folds.
    [z        - move to start of open fold.
    ]z        - move to end of open fold.

Spelling
--------

    z-      - show list of suggested words
    zg      - add a word to the spelling dictionary
    zw      - remove a word to the spelling dictionary

Plugins
-------

### Nerd Tree ###

    t   - Open the selected file in a new tab
    i   - Open the selected file in a horizontal split window
    s   - Open the selected file in a vertical split window
    I   - Toggle hidden files
    m   - Show the NERD Tree menu
    R   - Refresh the tree, useful if files change outside of Vim
    ?   - Toggle NERD Tree's quick help

Git
===

Rewrite History
---------------
### Erase everything but "directory-to-keep", useful for splitting off a directory ###
[source](http://stackoverflow.com/a/2805084/1056965)

    git filter-branch --index-filter 'git ls-tree --name-only --full-tree $GIT_COMMIT | grep -v "^directory-to-keep$" | xargs git rm --cached -r' -- --all

### Erase specific directory ###

[see here](https://help.github.com/articles/remove-sensitive-data)

Default Applications
====================

Config Files
------------
~/.local/share/applications/defaults.list
~/.local/share/applications/mimeapps.list
~/.local/share/applications/mimeinfo.cache
/usr/share/applications/mimeinfo.cache
/usr/share/applications/mimeapps.list
/usr/share/applications/defaults.list
