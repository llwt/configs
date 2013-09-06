# Home & Config Notes

## OSX

### Ruby

#### Install RVM with stable Ruby

    $ \curl -L https://get.rvm.io | bash -s stable --ruby
   
*There is a backslash before curl. This prevents misbehaving if you have aliased it with configuration in your ~/.curlrc file.*

__For a progress bar when downloading RVM / Rubies:__

    $ echo progress-bar >> ~/.curlrc

[source](https://rvm.io/rvm/install)

### HomeBrew

__$PATH__

Move `/usr/local/bin` from the bottom to the top of `/etc/paths` so that homebrew apps take priority.
